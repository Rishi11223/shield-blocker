(() => {
  let styleEl = null;

  function applyCosmeticFilters() {
    chrome.storage.local.get(["shield_cosmetic", "shield_enabled", "shield_allowlist"], (data) => {
      if (data.shield_enabled === false) {
        if (styleEl) { styleEl.remove(); styleEl = null; }
        return;
      }

      const list = data.shield_cosmetic || [];
      if (list.length === 0) return;

      // Check allowlist
      const allowlist = data.shield_allowlist || [];
      const hostname = location.hostname.replace(/^www\./, "");
      if (allowlist.some(d => hostname === d || hostname.endsWith("." + d))) {
        if (styleEl) { styleEl.remove(); styleEl = null; }
        return;
      }

      // Build CSS
      const css = list.join(",\n") + " {\n  display: none !important;\n}\n";

      if (styleEl) styleEl.remove();
      styleEl = document.createElement("style");
      styleEl.textContent = css;
      styleEl.id = "shield-blocker-cosmetic";
      document.documentElement.appendChild(styleEl);
    });
  }

  // Apply on load and when storage changes
  applyCosmeticFilters();
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.shield_cosmetic || changes.shield_enabled || changes.shield_allowlist) {
      applyCosmeticFilters();
    }
  });
})();
