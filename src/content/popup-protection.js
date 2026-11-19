(function (root) {
  "use strict";

  function initBehaviorProtection(enabled) {
    return Boolean(enabled);
  }

  root.UniversalAdBlockerPopupProtection = { initBehaviorProtection };
  if (typeof module !== "undefined") module.exports = { initBehaviorProtection };
})(typeof globalThis !== "undefined" ? globalThis : this);
