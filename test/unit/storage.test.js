const test = require("node:test");
const assert = require("node:assert/strict");
const { mergeDefaults } = require("../../src/shared/storage.js");

test("fills missing storage values", () => {
  const config = mergeDefaults({});
  assert.equal(config.enabled, true);
  assert.deepEqual(config.whitelist, []);
  assert.equal(config.cosmeticFiltering, true);
});

test("falls back from invalid types", () => {
  const config = mergeDefaults({
    enabled: "yes",
    whitelist: "example.com",
    cosmeticFiltering: null,
    statistics: { blockedRequests: "10", hiddenElements: null }
  });
  assert.equal(config.enabled, true);
  assert.deepEqual(config.whitelist, []);
  assert.equal(config.cosmeticFiltering, true);
  assert.equal(config.statistics.blockedRequests, 0);
  assert.equal(config.statistics.hiddenElements, 0);
});
