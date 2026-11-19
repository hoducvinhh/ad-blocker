(function (root) {
  "use strict";

  async function recordHiddenElements(storageApi, count) {
    if (!Number.isInteger(count) || count <= 0) return null;
    const config = await storageApi.getConfig();
    const hiddenElements = config.statistics.hiddenElements + count;
    const statistics = {
      blockedRequests: config.statistics.blockedRequests,
      hiddenElements,
      lastUpdatedAt: new Date().toISOString()
    };
    await storageApi.setValues({ statistics });
    return statistics;
  }

  const api = { recordHiddenElements };
  root.UniversalAdBlockerStatistics = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
