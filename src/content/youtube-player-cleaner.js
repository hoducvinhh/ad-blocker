(function () {
  "use strict";

  if (window.__uab_player_cleaner_injected__) return;
  window.__uab_player_cleaner_injected__ = true;

  function stripAdsFromPlayerResponse(obj) {
    if (!obj || typeof obj !== "object") return obj;

    if (obj.adPlacements) delete obj.adPlacements;
    if (obj.adSlots) delete obj.adSlots;
    if (obj.playerAds) delete obj.playerAds;

    if (obj.playerConfig && obj.playerConfig.adConfig) {
      delete obj.playerConfig.adConfig;
    }

    return obj;
  }

  // 1. Hook window.ytInitialPlayerResponse
  let _ytInitialPlayerResponse = window.ytInitialPlayerResponse;
  if (_ytInitialPlayerResponse) {
    stripAdsFromPlayerResponse(_ytInitialPlayerResponse);
  }

  try {
    Object.defineProperty(window, "ytInitialPlayerResponse", {
      get() {
        return _ytInitialPlayerResponse;
      },
      set(value) {
        _ytInitialPlayerResponse = stripAdsFromPlayerResponse(value);
      },
      configurable: true,
      enumerable: true
    });
  } catch (_) {}

  // 2. Hook window.fetch for /youtubei/v1/player
  if (typeof window.fetch === "function") {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url ? args[0].url : "");
      const isPlayerRequest = url.includes("/youtubei/v1/player");

      const response = await originalFetch.apply(this, args);

      if (isPlayerRequest) {
        try {
          const clone = response.clone();
          const json = await clone.json();
          stripAdsFromPlayerResponse(json);

          return new Response(JSON.stringify(json), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        } catch (_) {
          return response;
        }
      }

      return response;
    };
  }

  // 3. Hook XMLHttpRequest for /youtubei/v1/player
  if (typeof window.XMLHttpRequest === "function") {
    const XHR = window.XMLHttpRequest;
    const originalOpen = XHR.prototype.open;
    const originalSend = XHR.prototype.send;

    XHR.prototype.open = function (method, url, ...rest) {
      this._uab_url = typeof url === "string" ? url : "";
      return originalOpen.apply(this, [method, url, ...rest]);
    };

    XHR.prototype.send = function (...args) {
      if (this._uab_url && this._uab_url.includes("/youtubei/v1/player")) {
        const self = this;
        const originalGetter = Object.getOwnPropertyDescriptor(XHR.prototype, "responseText");

        try {
          Object.defineProperty(self, "responseText", {
            get() {
              const raw = originalGetter ? originalGetter.get.call(self) : "";
              try {
                const data = JSON.parse(raw);
                stripAdsFromPlayerResponse(data);
                return JSON.stringify(data);
              } catch (_) {
                return raw;
              }
            },
            configurable: true
          });
        } catch (_) {}
      }
      return originalSend.apply(this, args);
    };
  }
})();
