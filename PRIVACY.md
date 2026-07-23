# Shield Blocker Privacy Policy

Shield Blocker does **not** collect, store, or transmit any personal data.

## What the extension does

Shield Blocker blocks ads and trackers locally using Chrome's built-in `declarativeNetRequest` API and CSS-based element hiding.

## Data handling

- **No data collection**: All blocking happens locally on your device
- **No analytics**: No tracking, no telemetry, no cookies
- **No external servers**: The only network request is downloading EasyList filter list on install
- **Filter lists**: EasyList is fetched from `easylist.to` and stored locally. This happens once on install and periodically when Chrome restarts.
- **Blocked count**: Stored locally in your browser's `chrome.storage` — never sent anywhere

## Permissions used

- `declarativeNetRequest` — Needed to block ad network requests
- `declarativeNetRequestFeedback` — Needed to count blocked requests for the popup counter
- `storage` — Saves your settings and allowlist locally
- `host_permissions` (`<all_urls>`) — Needed to block ads on any website

## Third-party data sharing

Shield Blocker does **not** sell, transfer, or share any user data with third parties.
