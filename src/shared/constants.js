(function (root) {
  "use strict";

  const constants = {
    STORAGE_KEYS: {
      CONFIG_VERSION: "configVersion",
      ENABLED: "enabled",
      WHITELIST: "whitelist",
      COSMETIC_FILTERING: "cosmeticFiltering",
      BEHAVIOR_PROTECTION: "behaviorProtection",
      FILTER_LISTS: "filterLists",
      STATISTICS: "statistics",
      RULE_METADATA: "ruleMetadata"
    },
    DEFAULT_CONFIG: {
      configVersion: 1,
      enabled: true,
      whitelist: [],
      cosmeticFiltering: true,
      behaviorProtection: false,
      filterLists: [],
      statistics: {
        blockedRequests: 0,
        hiddenElements: 0,
        lastUpdatedAt: null
      },
      ruleMetadata: {
        activeRuleCount: 0,
        lastUpdatedAt: null
      }
    },
    ACTIONS: {
      GET_STATE: "getState",
      SET_ENABLED: "setEnabled",
      GET_CURRENT_TAB: "getCurrentTab",
      GET_WHITELIST: "getWhitelist",
      ADD_WHITELIST: "addWhitelist",
      REMOVE_WHITELIST: "removeWhitelist",
      REFRESH_RULES: "refreshRules",
      RECORD_HIDDEN_ELEMENTS: "recordHiddenElements",
      GET_STATISTICS: "getStatistics",
      SET_COSMETIC_FILTERING: "setCosmeticFiltering",
      SET_BEHAVIOR_PROTECTION: "setBehaviorProtection"
    }
  };

  root.UniversalAdBlockerConstants = constants;
  if (typeof module !== "undefined") module.exports = constants;
})(typeof globalThis !== "undefined" ? globalThis : this);
