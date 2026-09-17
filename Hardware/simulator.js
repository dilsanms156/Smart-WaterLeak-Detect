#!/usr/bin/env node
/**
 * ESP32 Hardware Simulator for Smart Water Leakage Detection System (Node.js version)
 * ====================================================================================
 * Simulates ESP32 micro-controller telemetry, pulse calculations, local safety relay state,
 * and command polling against the Next.js backend API over HTTP/HTTPS.
 *
 * Usage:
 *   node Hardware/simulator.js [--url http://localhost:3000] [--token TOKEN]
 */

const http = require('http');
const https = require('https');
const readline = require('readline');

const args = process.argv.slice(2);
let serverUrl = 'http://localhost:3000';
let deviceToken = 'placeholder_device_token_for_testing';
let deviceId = 'water-leak-device-01';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) serverUrl = args[++i];
  if (args[i] === '--token' && args[i + 1]) deviceToken = args[++i];
  if (args[i] === '--device' && args[i + 1]) deviceId = args[++i];
}

serverUrl = serverUrl.replace(/\/$/, '');

// Colors
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let pumpState = false;
let leakDetected = false;
let leakLocation = 'NONE';
let flowS1 = 0.0;
let flowS2 = 0.0;
let flowS3 = 0.0;
let mode = 'normal';
const startTime = Date.now();
let leakSuspectTime = null;
let suspectedLocation = null;

function log(tag, message, color = RESET) {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  console.log(`${color}[${tag}] [t=${String(uptime).padStart(4, ' ')}s] ${message}${RESET}`);
}

function updateFlowRates() {
  if (!pumpState) {
    flowS1 = 0.0;
    flowS2 = 0.0;
    flowS3 = 0.0;
    return;
  }
  const baseFlow = 12.5;
  if (mode === 'normal') {
    flowS1 = baseFlow;
    flowS2 = baseFlow;
    flowS3 = baseFlow;
  } else if (mode === 'leak_s1_s2') {
    flowS1 = baseFlow;
    flowS2 = baseFlow - 3.2;
    flowS3 = baseFlow - 3.2;
  } else if (mode === 'leak_s2_s3') {
    flowS1 = baseFlow;
    flowS2 = baseFlow;
    flowS3 = baseFlow - 4.1;
  }
}

function checkLocalSafetyLogic() {
  if (flowS1 < 0.3) {
    leakSuspectTime = null;
    suspectedLocation = null;
    return;
  }

  const diff12 = flowS1 - flowS2;
  const diff23 = flowS2 - flowS3;
  const threshold = 0.5;

  let currentSuspect = '';
  if (diff12 > threshold) currentSuspect = 'BETWEEN S1 AND S2';
  else if (diff23 > threshold) currentSuspect = 'BETWEEN S2 AND S3';

  if (currentSuspect) {
    if (suspectedLocation !== currentSuspect) {
      suspectedLocation = currentSuspect;
      leakSuspectTime = Date.now();
      log('SAFETY', `Leak suspected ${currentSuspect}. Confirmation timer started...`, YELLOW);
    } else if (Date.now() - leakSuspectTime >= 3000) {
      if (!leakDetected) {
        leakDetected = true;
        leakLocation = currentSuspect;
        pumpState = false;
        log('ALERT', `⚠ CONFIRMED LEAK (${currentSuspect}) — EMERGENCY PUMP SHUTDOWN EXECUTED!`, RED + BOLD);
      }
    }
  } else {
    if (leakSuspectTime) {
      log('SAFETY', 'Flow normalized. Leak suspicion cleared.', GREEN);
      leakSuspectTime = null;
      suspectedLocation = null;
    }
  }
}

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(serverUrl + path);
    const client = urlObj.protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : null;

    const req = client.request(
      urlObj,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-device-token': deviceToken,
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
        timeout: 5000,
      },
      (res) => {
        let responseText = '';
        res.on('data', (chunk) => (responseText += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(responseText) });
          } catch {
            resolve({ status: res.statusCode, data: responseText });
          }
        });
      }
    );

    req.on('error', (err) => resolve({ status: -1, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: -1, error: 'Timeout' });
    });

    if (data) req.write(data);
    req.end();
  });
}

async function sendTelemetry() {
  const payload = {
    deviceId,
    sensor1Flow: Number(flowS1.toFixed(2)),
    sensor2Flow: Number(flowS2.toFixed(2)),
    sensor3Flow: Number(flowS3.toFixed(3)),
    leakDetected,
    leakLocation,
    pumpState,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  const res = await makeRequest('/api/device/telemetry', 'POST', payload);
  if (res.status === 200 || res.status === 201) {
    log(
      'TELEMETRY',
      `Uploaded S1:${flowS1.toFixed(1)} S2:${flowS2.toFixed(1)} S3:${flowS3.toFixed(1)} L/min | Pump:${pumpState ? 'ON' : 'OFF'}`,
      CYAN
    );
  } else {
    log('TELEMETRY', `Upload failed (${res.status}): ${JSON.stringify(res.error || res.data)}`, RED);
  }
}

async function pollCommands() {
  const res = await makeRequest(`/api/device/command?deviceId=${deviceId}`, 'GET');
  if (res.status === 200 && res.data) {
    const data = res.data.data || res.data;
    const command = data.command;
    const cmdId = data.id;

    if (command) {
      log('COMMAND', `Received command from server: ${command} (id=${cmdId})`, BOLD + YELLOW);
      if (command === 'ON') {
        if (leakDetected) {
          log('COMMAND', 'REJECTED ON command — leak is active!', RED);
          await makeRequest('/api/device/command', 'POST', { id: cmdId, status: 'rejected', deviceId });
        } else {
          pumpState = true;
          log('PUMP', 'Pump turned ON via remote command', GREEN);
          await makeRequest('/api/device/command', 'POST', { id: cmdId, status: 'executed', deviceId });
        }
      } else if (command === 'OFF') {
        pumpState = false;
        log('PUMP', 'Pump turned OFF via remote command', YELLOW);
        await makeRequest('/api/device/command', 'POST', { id: cmdId, status: 'executed', deviceId });
      }
    }
  }
}

async function sendHeartbeat() {
  const payload = {
    deviceId,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    pumpState,
    leakDetected,
  };
  const res = await makeRequest('/api/device/heartbeat', 'POST', payload);
  if (res.status === 200) {
    log('HEARTBEAT', 'Heartbeat OK', GREEN);
  }
}

function startLoops() {
  setInterval(async () => {
    updateFlowRates();
    checkLocalSafetyLogic();
    await sendTelemetry();
  }, 3000);

  setInterval(async () => {
    await pollCommands();
  }, 2000);

  setInterval(async () => {
    await sendHeartbeat();
  }, 15000);
}

function setupCLI() {
  console.log(`\n${BOLD}${CYAN}========================================================`);
  console.log('  Smart Water Leakage Detection — ESP32 Hardware Simulator');
  console.log(`========================================================${RESET}`);
  console.log(`Server URL: ${serverUrl}`);
  console.log(`Device ID : ${deviceId}`);
  console.log('\nCommands:');
  console.log('  1 - Turn Pump ON');
  console.log('  2 - Turn Pump OFF');
  console.log('  n - Set Normal Flow Mode (No Leaks)');
  console.log('  l1 - Inject Leak between S1 & S2');
  console.log('  l2 - Inject Leak between S2 & S3');
  console.log('  r - Reset Leak Alarm State');
  console.log('  q - Quit Simulator\n');

  startLoops();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on('line', (line) => {
    const cmd = line.trim().toLowerCase();
    if (cmd === '1') {
      if (leakDetected) console.log(`${RED}Cannot start pump: Leak active! Reset leak state first ('r').${RESET}`);
      else {
        pumpState = true;
        console.log(`${GREEN}Pump switched to ON${RESET}`);
      }
    } else if (cmd === '2') {
      pumpState = false;
      console.log(`${YELLOW}Pump switched to OFF${RESET}`);
    } else if (cmd === 'n') {
      mode = 'normal';
      console.log(`${GREEN}Mode set to NORMAL (No flow differential)${RESET}`);
    } else if (cmd === 'l1') {
      mode = 'leak_s1_s2';
      console.log(`${RED}Mode set to LEAK BETWEEN S1 AND S2${RESET}`);
    } else if (cmd === 'l2') {
      mode = 'leak_s2_s3';
      console.log(`${RED}Mode set to LEAK BETWEEN S2 AND S3${RESET}`);
    } else if (cmd === 'r') {
      leakDetected = false;
      leakLocation = 'NONE';
      console.log(`${GREEN}Leak alarm reset manually.${RESET}`);
    } else if (cmd === 'q') {
      process.exit(0);
    }
  });
}

setupCLI();
