(function (root) {
  "use strict";

  function normalizeDomain(input) {
    if (typeof input !== "string") return null;
    let value = input.trim().toLowerCase();
    if (!value) return null;

    if (/^[a-z][a-z0-9+.-]*:/.test(value)) {
      try {
        value = new URL(value).hostname;
      } catch (_) {
        return null;
      }
    }

    value = value.replace(/\/.*$/, "").replace(/^\.+|\.+$/g, "");
    value = value.replace(/^www\./, "");

    if (!value || /^[0-9.]+$/.test(value) || /[^\p{L}\p{N}._-]/u.test(value)) return null;
    if (!value.includes(".") || value.length > 253) return null;
    if (value.includes("..") || value.startsWith("-") || value.endsWith("-")) return null;
    return value;
  }

  function isWhitelisted(hostname, whitelist) {
    const normalized = normalizeDomain(hostname);
    if (!normalized || !Array.isArray(whitelist)) return false;
    return whitelist.some((domain) => {
      const normalizedEntry = normalizeDomain(domain);
      return normalizedEntry && (normalized === normalizedEntry || normalized.endsWith("." + normalizedEntry));
    });
  }

  function getHostname(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      return normalizeDomain(parsed.hostname);
    } catch (_) {
      return null;
    }
  }

  const api = { normalizeDomain, isWhitelisted, getHostname };
  root.UniversalAdBlockerDomain = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
