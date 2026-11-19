(async function () {
  "use strict";

  const storage = UniversalAdBlockerStorage;
  const domainApi = UniversalAdBlockerDomain;
  const cosmetic = UniversalAdBlockerCosmetic;
  const { DomScanner } = UniversalAdBlockerDomScanner;

  let scanner = null;
  let reportTimer = null;

  async function loadCosmeticRules() {
    try {
      const response = await fetch(chrome.runtime.getURL("filters/cosmetic-rules.json"));
      if (!response.ok) return cosmetic.DEFAULT_COSMETIC_RULES;
      return await response.json();
    } catch (_) {
      return cosmetic.DEFAULT_COSMETIC_RULES;
    }
  }

  function reportHiddenElements() {
    if (!scanner || scanner.hiddenCount <= 0) return;
    const count = scanner.hiddenCount;
    scanner.hiddenCount = 0;
    chrome.runtime.sendMessage({
      action: UniversalAdBlockerConstants.ACTIONS.RECORD_HIDDEN_ELEMENTS,
      count
    });
  }

  async function refresh() {
    const config = await storage.getConfig();
    if (scanner) {
      scanner.stop();
      scanner = null;
    }
    if (!config.enabled || !config.cosmeticFiltering) return;

    const hostname = domainApi.getHostname(location.href);
    if (!hostname || domainApi.isWhitelisted(hostname, config.whitelist)) return;

    const rules = await loadCosmeticRules();
    scanner = new DomScanner(cosmetic.getSelectors(rules, hostname));
    scanner.start();
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.enabled || changes.cosmeticFiltering || changes.whitelist) refresh();
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.action === "refreshContentFilters") refresh();
  });

  window.addEventListener("beforeunload", () => {
    if (scanner) reportHiddenElements();
  });

  await refresh();

  reportTimer = setInterval(reportHiddenElements, 5000);
  window.addEventListener("pagehide", () => clearInterval(reportTimer));
})();
