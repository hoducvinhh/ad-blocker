(function () {
  "use strict";

  const constants = UniversalAdBlockerConstants;
  let currentHostname = null;

  function send(action, extra) {
    return chrome.runtime.sendMessage(Object.assign({ action }, extra || {}));
  }

  function setMessage(value) {
    document.getElementById("message").textContent = value || "";
  }

  function render(config, tabInfo) {
    currentHostname = tabInfo && tabInfo.hostname;
    document.getElementById("statusText").textContent = config.enabled ? "ON" : "OFF";
    document.getElementById("statusDot").classList.toggle("on", config.enabled);
    const toggle = document.getElementById("toggleButton");
    toggle.classList.toggle("on", config.enabled);
    toggle.setAttribute("aria-pressed", String(config.enabled));

    document.getElementById("hostname").textContent =
      tabInfo.restricted ? "Browser restricted" : (currentHostname || "Unavailable");

    const whitelistButton = document.getElementById("whitelistButton");
    whitelistButton.disabled = !currentHostname;
    whitelistButton.textContent = config.whitelist.includes(currentHostname) ? "Remove from whitelist" : "Whitelist website";

    document.getElementById("hiddenCount").textContent = String(config.statistics.hiddenElements);
    document.getElementById("blockedCount").textContent = String(config.statistics.blockedRequests);
  }

  async function refresh() {
    setMessage("");
    const state = await send(constants.ACTIONS.GET_STATE);
    const tab = await send(constants.ACTIONS.GET_CURRENT_TAB);
    if (!state.ok || !tab.ok) {
      setMessage(state.error || tab.error || "Could not load extension state");
      return;
    }
    render(state.config, tab);
  }

  document.getElementById("toggleButton").addEventListener("click", async () => {
    const state = await send(constants.ACTIONS.GET_STATE);
    if (!state.ok) return setMessage(state.error);
    const response = await send(constants.ACTIONS.SET_ENABLED, { value: !state.config.enabled });
    if (!response.ok) return setMessage(response.error);
    await refresh();
  });

  document.getElementById("whitelistButton").addEventListener("click", async () => {
    if (!currentHostname) return;
    const state = await send(constants.ACTIONS.GET_STATE);
    if (!state.ok) return setMessage(state.error);
    const removing = state.config.whitelist.includes(currentHostname);
    const response = await send(removing ? constants.ACTIONS.REMOVE_WHITELIST : constants.ACTIONS.ADD_WHITELIST, {
      domain: currentHostname
    });
    if (!response.ok) return setMessage(response.error);
    await refresh();
  });

  document.getElementById("optionsButton").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  chrome.storage.onChanged.addListener(refresh);
  refresh();
})();
