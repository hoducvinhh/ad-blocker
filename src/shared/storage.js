(function (root) {
  "use strict";

  const constants = root.UniversalAdBlockerConstants || require("./constants.js");

  function mergeDefaults(values) {
    const defaults = constants.DEFAULT_CONFIG;
    const result = Object.assign({}, defaults, values || {});

    if (typeof result.enabled !== "boolean") result.enabled = defaults.enabled;
    if (!Array.isArray(result.whitelist)) result.whitelist = [];
    if (typeof result.cosmeticFiltering !== "boolean") result.cosmeticFiltering = defaults.cosmeticFiltering;
    if (typeof result.behaviorProtection !== "boolean") result.behaviorProtection = defaults.behaviorProtection;
    if (!Array.isArray(result.filterLists)) result.filterLists = [];
    if (!result.statistics || typeof result.statistics !== "object") result.statistics = Object.assign({}, defaults.statistics);
    result.statistics.blockedRequests = Number.isInteger(result.statistics.blockedRequests) ? result.statistics.blockedRequests : 0;
    result.statistics.hiddenElements = Number.isInteger(result.statistics.hiddenElements) ? result.statistics.hiddenElements : 0;
    if (!result.ruleMetadata || typeof result.ruleMetadata !== "object") result.ruleMetadata = Object.assign({}, defaults.ruleMetadata);
    return result;
  }

  async function getConfig() {
    if (!root.chrome || !chrome.storage || !chrome.storage.local) return mergeDefaults({});
    const values = await chrome.storage.local.get(Object.values(constants.STORAGE_KEYS));
    return mergeDefaults(values);
  }

  async function setValues(values) {
    if (!root.chrome || !chrome.storage || !chrome.storage.local) throw new Error("Chrome storage API unavailable");
    await chrome.storage.local.set(values);
  }

  const api = { mergeDefaults, getConfig, setValues };
  root.UniversalAdBlockerStorage = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
