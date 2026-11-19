(function () {
  "use strict";

  const constants = UniversalAdBlockerConstants;
  const domainApi = UniversalAdBlockerDomain;

  function send(action, extra) {
    return chrome.runtime.sendMessage(Object.assign({ action }, extra || {}));
  }

  function setMessage(value) {
    document.getElementById("message").textContent = value || "";
  }

  function renderWhitelist(domains) {
    const list = document.getElementById("whitelistList");
    list.replaceChildren();
    domains.forEach((domain) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = domain;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "remove-domain";
      button.textContent = "Remove";
      button.addEventListener("click", async () => {
        const response = await send(constants.ACTIONS.REMOVE_WHITELIST, { domain });
        if (!response.ok) setMessage(response.error);
        await refresh();
      });
      item.append(name, button);
      list.append(item);
    });
  }

  async function refresh() {
    setMessage("");
    const state = await send(constants.ACTIONS.GET_STATE);
    if (!state.ok) return setMessage(state.error);
    document.getElementById("enabled").checked = state.config.enabled;
    document.getElementById("cosmetic").checked = state.config.cosmeticFiltering;
    document.getElementById("behavior").checked = state.config.behaviorProtection;
    document.getElementById("hiddenCount").textContent = String(state.config.statistics.hiddenElements);
    document.getElementById("blockedCount").textContent = String(state.config.statistics.blockedRequests);
    document.getElementById("ruleCount").textContent =
      `${state.config.ruleMetadata.activeRuleCount} active dynamic rules`;
    renderWhitelist(state.config.whitelist);
  }

  document.getElementById("enabled").addEventListener("change", async (event) => {
    await send(constants.ACTIONS.SET_ENABLED, { value: event.target.checked });
  });

  document.getElementById("cosmetic").addEventListener("change", async (event) => {
    await send(constants.ACTIONS.SET_COSMETIC_FILTERING, { value: event.target.checked });
  });

  document.getElementById("behavior").addEventListener("change", async (event) => {
    await send(constants.ACTIONS.SET_BEHAVIOR_PROTECTION, { value: event.target.checked });
  });

  document.getElementById("whitelistForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("domainInput");
    const response = await send(constants.ACTIONS.ADD_WHITELIST, { domain: input.value });
    if (!response.ok) setMessage(response.error);
    else input.value = "";
    await refresh();
  });

  document.getElementById("refreshRules").addEventListener("click", async () => {
    const response = await send(constants.ACTIONS.REFRESH_RULES);
    if (!response.ok) setMessage(response.error);
    await refresh();
  });

  document.getElementById("exportButton").addEventListener("click", async () => {
    const state = await send(constants.ACTIONS.GET_STATE);
    if (!state.ok) return setMessage(state.error);
    const exportData = {
      configVersion: 1,
      enabled: state.config.enabled,
      whitelist: state.config.whitelist,
      cosmeticFiltering: state.config.cosmeticFiltering,
      behaviorProtection: state.config.behaviorProtection,
      filterLists: state.config.filterLists
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "universal-ad-blocker-config.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importButton").addEventListener("click", () => {
    document.getElementById("importInput").click();
  });

  document.getElementById("importInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return setMessage("Configuration file is too large");
    try {
      const data = JSON.parse(await file.text());
      if (data.configVersion !== 1 || !Array.isArray(data.whitelist) || typeof data.enabled !== "boolean") {
        throw new Error("Unsupported configuration schema");
      }
      const importedWhitelist = data.whitelist
        .map((domain) => domainApi.normalizeDomain(domain))
        .filter((domain) => Boolean(domain));
      if (importedWhitelist.length !== data.whitelist.length) {
        throw new Error("Whitelist contains invalid domain entries");
      }
      await chrome.storage.local.set({
        enabled: data.enabled,
        whitelist: [...new Set(importedWhitelist)].sort(),
        cosmeticFiltering: typeof data.cosmeticFiltering === "boolean" ? data.cosmeticFiltering : true,
        behaviorProtection: false,
        filterLists: Array.isArray(data.filterLists) ? data.filterLists : []
      });
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  });

  chrome.storage.onChanged.addListener(refresh);
  refresh();
})();
