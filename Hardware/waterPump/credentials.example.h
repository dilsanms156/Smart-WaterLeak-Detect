// =============================================================================
// Credentials Template — Copy to credentials.h and fill in your values
// =============================================================================
// ⚠ NEVER commit credentials.h to version control!
// ⚠ Only this template file (credentials.example.h) should be in the repo.
// =============================================================================

#ifndef CREDENTIALS_H
#define CREDENTIALS_H

// Wi-Fi credentials
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// Backend server URL (your deployed Next.js app, no trailing slash)
// Examples:
//   "https://your-app.vercel.app"
//   "https://your-domain.com"
//   "http://192.168.1.100:3000"  (local development only — NOT HTTPS)
#define SERVER_URL      "https://your-app.vercel.app"

// Device API token — must match DEVICE_API_TOKEN in the Next.js .env
// Generate a strong random string, e.g.:  openssl rand -hex 32
#define DEVICE_API_TOKEN "YOUR_DEVICE_API_TOKEN"

#endif // CREDENTIALS_H
