(function (root) {
  "use strict";

  const parser = root.UniversalAdBlockerRuleParser || require("./rule-parser.js");
  const ruleManager = root.UniversalAdBlockerRuleManager || require("./rule-manager.js");

  async function applyRules(parsedRules, whitelist, enabled) {
    if (!enabled) {
      await ruleManager.replaceDynamicRules([]);
      return 0;
    }

    const dnrRules = parser.toDnrRules(parsedRules).map((rule) => {
      if (whitelist.length && rule.action.type === "block") {
        rule.condition.excludedInitiatorDomains = whitelist.slice();
      }
      return rule;
    });
    await ruleManager.replaceDynamicRules(dnrRules);
    return dnrRules.length;
  }

  const api = { applyRules };
  root.UniversalAdBlockerNetwork = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
