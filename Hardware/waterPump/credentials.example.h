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

// Production backend server URL (Vercel deployment, no trailing slash)
#define SERVER_URL      "https://smartwaterleakdetect.vercel.app"

// Device API token — must match DEVICE_API_TOKEN in the Next.js .env
#define DEVICE_API_TOKEN "YOUR_DEVICE_API_TOKEN"

#endif // CREDENTIALS_H
