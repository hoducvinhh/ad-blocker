const test = require("node:test");
const assert = require("node:assert/strict");
const { parseRules, toDnrRules } = require("../../src/core/rule-parser.js");

test("parses valid block rules", () => {
  const parsed = parseRules({
    rules: [{
      id: 1,
      priority: 1,
      action: "block",
      urlFilter: "||ads.example^",
      resourceTypes: ["script", "image"],
      excludedInitiatorDomains: []
    }]
  });
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].urlFilter, "||ads.example^");
});

test("rejects duplicate rule ids", () => {
  const rule = {
    id: 1,
    priority: 1,
    action: "block",
    urlFilter: "||ads.example^",
    resourceTypes: ["script"]
  };
  assert.throws(() => parseRules([rule, rule]), /Duplicate rule id/);
});

test("rejects invalid resource types", () => {
  assert.throws(() => parseRules([{
    id: 1,
    priority: 1,
    action: "block",
    urlFilter: "||ads.example^",
    resourceTypes: ["document"]
  }]), /Invalid resource type/);
});

test("converts parsed rules to DNR format", () => {
  const dnr = toDnrRules(parseRules([{
    id: 2,
    priority: 3,
    action: "allow",
    urlFilter: "||example.com^",
    resourceTypes: ["main_frame"]
  }]));
  assert.deepEqual(dnr[0].action, { type: "allow" });
  assert.deepEqual(dnr[0].condition.resourceTypes, ["main_frame"]);
});
