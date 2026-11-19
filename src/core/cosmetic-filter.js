(function (root) {
  "use strict";

  const DEFAULT_COSMETIC_RULES = {
    global: [
      ".ad-banner",
      ".ad-slot",
      ".advertisement",
      "[data-ad]",
      "[data-ad-slot]",
      "iframe[src*=\"doubleclick.net\"]",
      "iframe[src*=\"googlesyndication.com\"]"
    ],
    domains: {
      "youtube.com": [
        "#player-ads",
        ".ytp-ad-overlay-container",
        ".ytp-ad-overlay-slot",
        ".ytp-ad-message-container",
        ".ytp-ad-action-interstitial",
        ".ytp-ad-image-overlay",
        ".ytp-ad-player-overlay",
        ".ytp-ad-player-overlay-layout",
        ".ytp-ad-player-overlay-flyout-cta",
        ".ytp-ad-button-vm",
        ".ytp-ad-preview-container",
        ".ytp-ad-text",
        ".ytp-ad-hover-text-container",
        "ytd-ad-slot-renderer",
        "ytd-in-feed-ad-layout-renderer",
        "ytd-rich-item-renderer:has(ytd-ad-slot-renderer)",
        "ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer)",
        "ytd-rich-item-renderer:has(.ytd-ad-slot-renderer)",
        "ytd-rich-item-renderer:has(#ad-badge)",
        "ytd-rich-item-renderer:has([aria-label*=\"Được tài trợ\"])",
        "ytd-rich-item-renderer:has([aria-label*=\"Sponsored\"])",
        "ytd-rich-section-renderer:has(ytd-ad-slot-renderer)",
        "ytd-rich-section-renderer:has(ytd-in-feed-ad-layout-renderer)",
        "#masthead-ad",
        "ytd-video-masthead-ad-v3-renderer",
        "ytd-statement-banner-renderer",
        "ytd-banner-promo-renderer",
        "ytd-promoted-video-renderer",
        "ytd-promoted-sparkles-web-renderer",
        "ytd-compact-promoted-video-renderer",
        "ytd-player-legacy-desktop-watch-ads-renderer",
        "ytd-action-companion-ad-renderer",
        "ytd-engagement-panel-section-list-renderer[target-id=\"engagement-panel-ads\"]",
        "yt-mealbar-promo-renderer",
        "ytd-popup-container:has(ytd-enforcement-message-view-model)",
        "tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)"
      ]
    }
  };

  function getSelectors(rules, hostname) {
    const set = new Set(rules && Array.isArray(rules.global) ? rules.global : DEFAULT_COSMETIC_RULES.global);
    const domainRules = rules && rules.domains ? rules.domains : DEFAULT_COSMETIC_RULES.domains;
    Object.keys(domainRules).forEach((domain) => {
      if (hostname === domain || hostname.endsWith("." + domain)) {
        const selectors = domainRules[domain];
        if (Array.isArray(selectors)) selectors.forEach((selector) => set.add(selector));
      }
    });
    return Array.from(set);
  }

  const api = { DEFAULT_COSMETIC_RULES, getSelectors };
  root.UniversalAdBlockerCosmetic = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
