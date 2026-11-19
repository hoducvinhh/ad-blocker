(async function () {
  "use strict";

  const storage = UniversalAdBlockerStorage;
  const domainApi = UniversalAdBlockerDomain;
  const cosmetic = UniversalAdBlockerCosmetic;
  const { DomScanner } = UniversalAdBlockerDomScanner;

  const STYLE_ELEMENT_ID = "universal-ad-blocker-styles";
  let scanner = null;
  let youtubeBlocker = null;
  let reportTimer = null;

  function rootOrGlobal(name) {
    if (typeof globalThis !== "undefined" && globalThis[name]) return globalThis[name];
    if (typeof window !== "undefined" && window[name]) return window[name];
    return null;
  }

  function applyCosmeticStyles(selectors) {
    let style = document.getElementById(STYLE_ELEMENT_ID);
    if (!selectors || !selectors.length) {
      if (style) style.remove();
      return;
    }
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ELEMENT_ID;
      const target = document.head || document.documentElement;
      if (target) {
        target.appendChild(style);
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          const parent = document.head || document.documentElement;
          if (parent && !document.getElementById(STYLE_ELEMENT_ID)) {
            parent.appendChild(style);
          }
        }, { once: true });
      }
    }
    style.textContent = selectors.join(",\n") + " { display: none !important; }";
  }

  function removeCosmeticStyles() {
    const style = document.getElementById(STYLE_ELEMENT_ID);
    if (style) style.remove();
  }

  function reportHiddenElements() {
    if (!scanner || scanner.hiddenCount <= 0) return;
    const count = scanner.hiddenCount;
    scanner.hiddenCount = 0;
    try {
      chrome.runtime.sendMessage({
        action: UniversalAdBlockerConstants.ACTIONS.RECORD_HIDDEN_ELEMENTS,
        count
      }).catch(() => {});
    } catch (_) {}
  }

  async function refresh() {
    const config = await storage.getConfig();
    if (scanner) {
      scanner.stop();
      scanner = null;
    }
    if (youtubeBlocker) {
      youtubeBlocker.stop();
      youtubeBlocker = null;
    }
    removeCosmeticStyles();

    if (!config.enabled) return;

    const hostname = domainApi.getHostname(location.href);
    if (!hostname || domainApi.isWhitelisted(hostname, config.whitelist)) return;

    if (config.cosmeticFiltering) {
      const selectors = cosmetic.getSelectors(cosmetic.DEFAULT_COSMETIC_RULES, hostname);
      applyCosmeticStyles(selectors);

      scanner = new DomScanner(selectors);
      scanner.start();
    }

    const isYouTube = hostname === "youtube.com" || hostname.endsWith(".youtube.com");
    if (isYouTube) {
      const ytModule = rootOrGlobal("UniversalAdBlockerYouTube");
      const YtClass = ytModule && ytModule.YouTubeAdBlocker ? ytModule.YouTubeAdBlocker : null;
      if (YtClass) {
        youtubeBlocker = new YtClass();
        youtubeBlocker.start();
      }
    }
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
