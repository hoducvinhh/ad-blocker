const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeDomain, isWhitelisted, getHostname } = require("../../src/shared/domain-utils.js");

test("normalizes hostnames", () => {
  assert.equal(normalizeDomain("https://Example.COM/path"), "example.com");
  assert.equal(normalizeDomain(" www.Example.com "), "example.com");
});

test("rejects invalid domains and IP addresses", () => {
  assert.equal(normalizeDomain(""), null);
  assert.equal(normalizeDomain("127.0.0.1"), null);
  assert.equal(normalizeDomain("not a domain"), null);
});

test("matches exact and subdomain whitelist entries", () => {
  assert.equal(isWhitelisted("example.com", ["example.com"]), true);
  assert.equal(isWhitelisted("news.example.com", ["example.com"]), true);
  assert.equal(isWhitelisted("example.org", ["example.com"]), false);
});

test("extracts HTTP hostname", () => {
  assert.equal(getHostname("https://Example.com/news"), "example.com");
  assert.equal(getHostname("chrome://extensions"), null);
});
