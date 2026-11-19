(function (root) {
  "use strict";

  const domainApi = root.UniversalAdBlockerDomain || require("../shared/domain-utils.js");

  async function addDomain(storageApi, domain) {
    const normalized = domainApi.normalizeDomain(domain);
    if (!normalized) throw new Error("Enter a valid hostname");
    const config = await storageApi.getConfig();
    if (!config.whitelist.includes(normalized)) {
      await storageApi.setValues({ whitelist: [...config.whitelist, normalized].sort() });
    }
    return normalized;
  }

  async function removeDomain(storageApi, domain) {
    const normalized = domainApi.normalizeDomain(domain);
    if (!normalized) throw new Error("Enter a valid hostname");
    const config = await storageApi.getConfig();
    await storageApi.setValues({ whitelist: config.whitelist.filter((item) => item !== normalized) });
  }

  const api = { addDomain, removeDomain };
  root.UniversalAdBlockerWhitelist = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
