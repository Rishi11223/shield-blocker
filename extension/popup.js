const toggleBtn = document.getElementById("toggleBtn");
const statusLabel = document.getElementById("statusLabel");
const blockedCount = document.getElementById("blockedCount");
const rulesCount = document.getElementById("rulesCount");
const cosmeticCount = document.getElementById("cosmeticCount");
const allowInput = document.getElementById("allowInput");
const allowlistContainer = document.getElementById("allowlistContainer");

let enabled = true;

function renderAllowlist(list) {
  allowlistContainer.innerHTML = "";
  if (!list || list.length === 0) {
    allowlistContainer.innerHTML = '<div style="font-size:11px;color:#555;padding:8px">No sites allowlisted</div>';
    return;
  }
  list.forEach(domain => {
    const div = document.createElement("div");
    div.className = "allowlist-item";
    div.innerHTML = `<span>${domain}</span><button onclick="removeAllow('${domain}')">×</button>`;
    allowlistContainer.appendChild(div);
  });
}

function refreshStats() {
  chrome.runtime.sendMessage({ type: "getStats" }, (stats) => {
    blockedCount.textContent = stats.blocked || 0;
    rulesCount.textContent = stats.rulesCount || 0;
    cosmeticCount.textContent = stats.cosmeticCount || 0;
  });
  chrome.runtime.sendMessage({ type: "getAllowlist" }, (list) => {
    renderAllowlist(list);
  });
}

function setEnabled(val) {
  enabled = val;
  toggleBtn.className = "toggle" + (val ? " on" : "");
  statusLabel.textContent = val ? "On" : "Off";
  chrome.runtime.sendMessage({ type: "toggleShield", enabled: val });
}

toggleBtn.addEventListener("click", () => setEnabled(!enabled));

function addAllow() {
  let domain = allowInput.value.trim().toLowerCase();
  if (!domain) return;
  domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  chrome.runtime.sendMessage({ type: "addAllowlist", domain }, () => {
    allowInput.value = "";
    refreshStats();
  });
}

function removeAllow(domain) {
  chrome.runtime.sendMessage({ type: "removeAllowlist", domain }, () => {
    refreshStats();
  });
}

// Load initial state
chrome.runtime.sendMessage({ type: "getStatus" }, (status) => {
  setEnabled(status.enabled);
  refreshStats();
});

// Auto-refresh stats
setInterval(refreshStats, 3000);
