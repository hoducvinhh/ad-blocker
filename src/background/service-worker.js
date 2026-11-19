importScripts(
  "../shared/constants.js",
  "../shared/storage.js",
  "../shared/domain-utils.js",
  "../core/rule-parser.js",
  "../core/rule-manager.js",
  "../core/network-filter.js",
  "../core/whitelist-manager.js",
  "./statistics-manager.js"
);

(async function () {
  "use strict";

  const constants = UniversalAdBlockerConstants;
  const storage = UniversalAdBlockerStorage;
  const domain = UniversalAdBlockerDomain;
  const network = UniversalAdBlockerNetwork;
  const whitelist = UniversalAdBlockerWhitelist;
  const statistics = UniversalAdBlockerStatistics;

  let rules = [];
  let refreshPromise = null;

  async function loadRules() {
    try {
      const response = await fetch(chrome.runtime.getURL("filters/custom-rules.json"));
      if (!response.ok) throw new Error("Could not load custom rules");
      rules = UniversalAdBlockerRuleParser.parseRules(await response.json());
    } catch (error) {
      console.warn("[Universal Ad Blocker] Filter rules could not be loaded:", error.message);
      rules = [];
    }
  }

  async function refreshRules() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      await loadRules();
      const config = await storage.getConfig();
      try {
        const count = await network.applyRules(rules, config.whitelist, config.enabled);
        await storage.setValues({
          ruleMetadata: {
            activeRuleCount: count,
            lastUpdatedAt: new Date().toISOString()
          }
        });
        await updateIcon(config.enabled);
        return { ok: true, activeRuleCount: count };
      } catch (error) {
        console.warn("[Universal Ad Blocker] Rule refresh failed:", error.message);
        return { ok: false, error: error.message };
      }
    })();

    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }

  async function updateIcon(enabled) {
    if (!chrome.action) return;
    await chrome.action.setBadgeText({ text: enabled ? "" : "OFF" });
    await chrome.action.setTitle({ title: enabled ? "Universal Ad Blocker: ON" : "Universal Ad Blocker: OFF" });
  }

  async function initialize() {
    const config = await storage.getConfig();
    await storage.setValues({ configVersion: 1 });
    await refreshRules();
    await updateIcon(config.enabled);
  }

  function success(data) {
    return Object.assign({ ok: true }, data || {});
  }

  function failure(error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  chrome.runtime.onInstalled.addListener(() => initialize());
  chrome.runtime.onStartup.addListener(() => initialize());

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.enabled || changes.whitelist || changes.filterLists) refreshRules();
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message.action !== "string") {
      sendResponse(failure("Invalid message"));
      return true;
    }

    (async () => {
      switch (message.action) {
        case constants.ACTIONS.GET_STATE: {
          const config = await storage.getConfig();
          sendResponse(success({ config }));
          break;
        }
        case constants.ACTIONS.SET_ENABLED: {
          if (typeof message.value !== "boolean") throw new Error("Enabled state must be boolean");
          await storage.setValues({ enabled: message.value });
          sendResponse(success({ enabled: message.value }));
          break;
        }
        case constants.ACTIONS.GET_CURRENT_TAB: {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          sendResponse(success({
            tabId: tab ? tab.id : null,
            hostname: tab && tab.url ? domain.getHostname(tab.url) : null,
            restricted: tab && tab.url ? domain.getHostname(tab.url) === null : true
          }));
          break;
        }
        case constants.ACTIONS.GET_WHITELIST: {
          const config = await storage.getConfig();
          sendResponse(success({ whitelist: config.whitelist }));
          break;
        }
        case constants.ACTIONS.ADD_WHITELIST: {
          const normalized = await whitelist.addDomain(storage, message.domain);
          await refreshRules();
          sendResponse(success({ domain: normalized }));
          break;
        }
        case constants.ACTIONS.REMOVE_WHITELIST: {
          await whitelist.removeDomain(storage, message.domain);
          await refreshRules();
          sendResponse(success({ domain: domain.normalizeDomain(message.domain) }));
          break;
        }
        case constants.ACTIONS.REFRESH_RULES:
          sendResponse(await refreshRules());
          break;
        case constants.ACTIONS.RECORD_HIDDEN_ELEMENTS: {
          const value = await statistics.recordHiddenElements(storage, message.count);
          sendResponse(success({ statistics: value }));
          break;
        }
        case constants.ACTIONS.GET_STATISTICS: {
          const config = await storage.getConfig();
          sendResponse(success({ statistics: config.statistics }));
          break;
        }
        case constants.ACTIONS.SET_COSMETIC_FILTERING: {
          if (typeof message.value !== "boolean") throw new Error("Cosmetic filtering state must be boolean");
          await storage.setValues({ cosmeticFiltering: message.value });
          sendResponse(success({ cosmeticFiltering: message.value }));
          break;
        }
        case constants.ACTIONS.SET_BEHAVIOR_PROTECTION: {
          if (typeof message.value !== "boolean") throw new Error("Behavior protection state must be boolean");
          await storage.setValues({ behaviorProtection: message.value });
          sendResponse(success({ behaviorProtection: message.value }));
          break;
        }
        default:
          sendResponse(failure("Unknown action"));
      }
    })().catch((error) => sendResponse(failure(error)));

    return true;
  });

  await initialize();
})();
