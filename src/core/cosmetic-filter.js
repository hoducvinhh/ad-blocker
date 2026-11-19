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
    domains: {}
  };

  function getSelectors(rules, hostname) {
    const set = new Set(rules && Array.isArray(rules.global) ? rules.global : DEFAULT_COSMETIC_RULES.global);
    const domainRules = rules && rules.domains ? rules.domains : {};
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
