# Shield Blocker

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A fast, lightweight ad blocker for Chrome. Uses EasyList filter lists to block ads, trackers, and popups across all websites.

## Features

- **Blocks ads & trackers** — uses EasyList filter list (20,000+ rules)
- **Toggle on/off** — one click to enable or disable
- **Blocked counter** — see how many ads have been blocked
- **Allowlist** — add sites where blocking should be disabled
- **Efficient** — uses `declarativeNetRequest` API, no CPU overhead
- **Privacy-first** — no data collected, no analytics, no tracking

## Installation

### From Chrome Web Store
[Install from Chrome Web Store](https://chrome.google.com/webstore) *(coming soon)*

### Manual installation (developer mode)
1. Download or clone this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `extension/` folder

## How it works

On install, Shield Blocker fetches EasyList and converts it to Chrome's `declarativeNetRequest` rules. These rules are applied declaratively by Chrome — no JavaScript runs on page load, making it extremely fast and efficient.

## Permissions

- `declarativeNetRequest` — to block ads using Chrome's built-in engine
- `declarativeNetRequestFeedback` — to count blocked requests
- `storage` — to save your settings and allowlist
- `host_permissions` (`<all_urls>`) — to block ads on any website
