const FILTER_LIST_URL = "https://easylist.to/easylist/easylist.txt";
const STATS_KEY = "shield_stats";

// Rule ID tracking
let ruleIdCounter = 1;

async function fetchFilters() {
  try {
    const resp = await fetch(FILTER_LIST_URL);
    const text = await resp.text();
    return parseFilters(text);
  } catch (e) {
    console.error("[shield] Failed to fetch filters:", e);
    return [];
  }
}

function parseFilters(text) {
  const rules = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("!") || trimmed.startsWith("[")) continue;

    // Convert ABP-style filter to regex pattern for DNR
    // We focus on the most common patterns: domain blocking and URL filters
    if (trimmed.startsWith("||")) {
      // Domain-level blocker: ||example.com^
      let domain = trimmed.slice(2).replace(/\^$/, "").replace(/\*/g, "");
      if (domain.includes("/")) continue; // skip URL-specific rules for now
      rules.push({
        id: ruleIdCounter++,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "*://*." + domain + "/*",
          resourceTypes: ["script", "image", "stylesheet", "xmlhttprequest", "sub_frame", "media", "font", "object"]
        }
      });
    } else if (trimmed.startsWith("|")) {
      // URL prefix blocker
      let url = trimmed.slice(1).replace(/\^/g, "").replace(/\*/g, "");
      rules.push({
        id: ruleIdCounter++,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: url + "*",
          resourceTypes: ["script", "image", "stylesheet", "xmlhttprequest", "sub_frame", "media", "font", "object"]
        }
      });
    } else if (trimmed.startsWith("##")) {
      // Element hiding - skip for DNR, handled differently
    } else if (!trimmed.startsWith("@@") && trimmed.includes(".")) {
      // Generic URL filter
      let clean = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, "*");
      if (clean.length > 5 && clean.length < 80) {
        rules.push({
          id: ruleIdCounter++,
          priority: 1,
          action: { type: "block" },
          condition: {
            urlFilter: clean,
            resourceTypes: ["script", "image", "stylesheet", "xmlhttprequest", "sub_frame", "media", "font", "object"]
          }
        });
      }
    }
  }

  return rules;
}

async function updateRules() {
  const state = await chrome.storage.local.get(["shield_enabled"]);
  if (state.shield_enabled === false) return;

  // Remove old dynamic rules
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id)
  });

  // Get fresh filters
  const rules = await fetchFilters();

  // Keep under 30K limit (DNR max)
  const limited = rules.slice(0, 29000);
  ruleIdCounter = limited.length + 1;

  // Add allowlist rules first
  const allowlist = await getAllowlist();
  const allowRules = allowlist.map((domain, i) => ({
    id: 30000 + i,
    priority: 2,
    action: { type: "allow" },
    condition: {
      urlFilter: "*://*." + domain + "/*",
      resourceTypes: ["main_frame", "sub_frame", "script", "image", "stylesheet", "xmlhttprequest", "media", "font", "object"]
    }
  }));

  // Apply rules
  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [...allowRules, ...limited]
  });

  // Update stats
  const stats = await getStats();
  stats.rulesCount = limited.length;
  await saveStats(stats);
}

function getAllowlist() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["shield_allowlist"], (data) => {
      resolve(data.shield_allowlist || []);
    });
  });
}

function getStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STATS_KEY], (data) => {
      resolve(data[STATS_KEY] || { blocked: 0, rulesCount: 0 });
    });
  });
}

function saveStats(stats) {
  return chrome.storage.local.set({ [STATS_KEY]: stats });
}

// Track blocked requests
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  chrome.storage.local.get([STATS_KEY], (data) => {
    const stats = data[STATS_KEY] || { blocked: 0, rulesCount: 0 };
    stats.blocked = (stats.blocked || 0) + 1;
    chrome.storage.local.set({ [STATS_KEY]: stats });
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getStats") {
    getStats().then(s => sendResponse(s));
    return true;
  }
  if (msg.type === "addAllowlist") {
    getAllowlist().then(async (list) => {
      if (!list.includes(msg.domain)) {
        list.push(msg.domain);
        await chrome.storage.local.set({ shield_allowlist: list });
        await updateRules();
      }
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.type === "removeAllowlist") {
    getAllowlist().then(async (list) => {
      const filtered = list.filter(d => d !== msg.domain);
      await chrome.storage.local.set({ shield_allowlist: filtered });
      await updateRules();
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.type === "getAllowlist") {
    getAllowlist().then(l => sendResponse(l));
    return true;
  }
  if (msg.type === "toggleShield") {
    chrome.storage.local.set({ shield_enabled: msg.enabled }).then(async () => {
      if (msg.enabled) {
        await updateRules();
      } else {
        const existing = await chrome.declarativeNetRequest.getDynamicRules();
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existing.map(r => r.id)
        });
      }
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.type === "getStatus") {
    chrome.storage.local.get(["shield_enabled"], (data) => {
      sendResponse({ enabled: data.shield_enabled !== false });
    });
    return true;
  }
  return true;
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["shield_enabled"]);
  if (data.shield_enabled === undefined) {
    await chrome.storage.local.set({ shield_enabled: true });
  }
  await updateRules();
});
