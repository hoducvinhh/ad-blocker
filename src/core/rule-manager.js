(function (root) {
  "use strict";

  async function getActiveDynamicRules() {
    if (!chrome.declarativeNetRequest) return [];
    return chrome.declarativeNetRequest.getDynamicRules();
  }

  async function replaceDynamicRules(rules) {
    if (!chrome.declarativeNetRequest) throw new Error("Declarative Net Request API unavailable");
    const active = await getActiveDynamicRules();
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: active.map((rule) => rule.id),
      addRules: rules
    });
  }

  const api = { getActiveDynamicRules, replaceDynamicRules };
  root.UniversalAdBlockerRuleManager = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
