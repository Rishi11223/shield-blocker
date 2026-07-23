(() => {
  let styleEl = null;

  // Universal ad selectors that catch most ad containers
  const UNIVERSAL = [
    "[id*='google_ads']", "[id*='GoogleAd']", "[id*='ad-']", "[id*='_ad_']",
    "[id*='adsense']", "[id*='advert']", "[id*='sponsor']", "[id*='banner']",
    "[id*='promo']", "[id*='dfp-']", "[id*='div-gpt']", "[id*='taboola']",
    "[id*='outbrain']", "[class*='ad-']", "[class*='_ad_']", "[class*='advert']",
    "[class*='adsense']", "[class*='sponsor']", "[class*='banner']", "[class*='promo']",
    "[class*='dfp-']", "[class*='googlead']", "div[data-ad]", "div[data-ad-slot]",
    "iframe[src*='doubleclick']", "iframe[src*='googlead']", "iframe[src*='adservice']",
    "[id*='taboola']", "[id*='outbrain']", "[class*='taboola']", "[class*='outbrain']",
    ".ad-container", ".ad-wrapper", ".ad-slot", ".ad-placeholder", ".ad-unit",
    ".ad-placement", ".advertisement", ".advertising", ".ad-section", ".ad-block",
    ".ad-inner", ".ad-banner", ".ad-frame", ".ad-text", ".ad-box", ".ad-label",
    "[data-ad-manager]", "[data-ad-width]", "#ad-container", "#ad-wrapper",
    "#ad-slot", "#ad-placement", "#advertisement", "#advertising",
    "amp-ad", "[placeholder='Ad']", ".adhesion", ".sticky-ad", ".mobile-ad",
    ".sidebar-ad", ".header-ad", ".footer-ad", ".inline-ad", ".interstitial-ad",
    ".popup-ad", ".video-ad", ".native-ad", ".feed-ad", ".widget-ad",
    ".adhesion-ad", ".premium-ad", ".sponsored-post", ".sponsored-content",
    ".sponsored-text", ".promoted-content", ".promoted-post", ".promoted-link",
    "[aria-label='Advertisement']", "[aria-label='Sponsor']", "[role='advertisement']"
  ];

  function buildCSS(extra) {
    const combined = [...UNIVERSAL, ...(extra || [])];
    return combined.join(",\n") + " {\n  display: none !important;\n}\n";
  }

  function applyCosmeticFilters() {
    chrome.storage.local.get(["shield_cosmetic", "shield_enabled", "shield_allowlist"], (data) => {
      if (data.shield_enabled === false) {
        if (styleEl) { styleEl.remove(); styleEl = null; }
        return;
      }

      const allowlist = data.shield_allowlist || [];
      const hostname = location.hostname.replace(/^www\./, "");
      if (allowlist.some(d => hostname === d || hostname.endsWith("." + d))) {
        if (styleEl) { styleEl.remove(); styleEl = null; }
        return;
      }

      const extra = data.shield_cosmetic || [];
      const css = buildCSS(extra);

      if (styleEl) styleEl.remove();
      styleEl = document.createElement("style");
      styleEl.textContent = css;
      styleEl.id = "shield-blocker-cosmetic";
      document.documentElement.appendChild(styleEl);
    });
  }

  applyCosmeticFilters();
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.shield_cosmetic || changes.shield_enabled || changes.shield_allowlist) {
      applyCosmeticFilters();
    }
  });
})();
