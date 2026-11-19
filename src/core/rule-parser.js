(function (root) {
  "use strict";

  const VALID_RESOURCE_TYPES = new Set([
    "main_frame", "sub_frame", "stylesheet", "script", "image", "font",
    "object", "xmlhttprequest", "ping", "media", "websocket", "other"
  ]);

  function parseRules(input) {
    const source = Array.isArray(input) ? input : (input && Array.isArray(input.rules) ? input.rules : []);
    const ids = new Set();
    const rules = [];

    source.forEach((entry) => {
      if (!entry || typeof entry !== "object") throw new Error("Invalid filter rule");
      if (!Number.isInteger(entry.id) || entry.id <= 0) throw new Error("Rule id must be a positive integer");
      if (ids.has(entry.id)) throw new Error("Duplicate rule id: " + entry.id);
      if (!["block", "allow"].includes(entry.action)) throw new Error("Invalid rule action");
      if (typeof entry.urlFilter !== "string" || !entry.urlFilter.trim()) throw new Error("Rule urlFilter is required");
      if (!Number.isInteger(entry.priority) || entry.priority < 1 || entry.priority > 100000) {
        throw new Error("Rule priority is out of range");
      }
      if (!Array.isArray(entry.resourceTypes) || entry.resourceTypes.length === 0) throw new Error("Rule resourceTypes are required");
      if (entry.resourceTypes.some((type) => !VALID_RESOURCE_TYPES.has(type))) throw new Error("Invalid resource type");

      if (entry.excludedInitiatorDomains !== undefined &&
          (!Array.isArray(entry.excludedInitiatorDomains) ||
           entry.excludedInitiatorDomains.some((domain) => typeof domain !== "string"))) {
        throw new Error("Invalid excluded initiator domains");
      }

      ids.add(entry.id);
      rules.push({
        id: entry.id,
        priority: entry.priority,
        action: entry.action,
        urlFilter: entry.urlFilter,
        resourceTypes: entry.resourceTypes.slice(),
        excludedInitiatorDomains: entry.excludedInitiatorDomains ? entry.excludedInitiatorDomains.slice() : []
      });
    });

    return rules;
  }

  function toDnrRules(parsedRules) {
    return parsedRules.map((rule) => {
      const dnr = {
        id: rule.id,
        priority: rule.priority,
        action: { type: rule.action === "allow" ? "allow" : "block" },
        condition: {
          urlFilter: rule.urlFilter,
          resourceTypes: rule.resourceTypes
        }
      };
      if (rule.excludedInitiatorDomains.length) dnr.condition.excludedInitiatorDomains = rule.excludedInitiatorDomains;
      return dnr;
    });
  }

  const api = { parseRules, toDnrRules };
  root.UniversalAdBlockerRuleParser = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
