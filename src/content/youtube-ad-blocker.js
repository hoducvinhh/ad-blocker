(function (root) {
  "use strict";

  class YouTubeAdBlocker {
    constructor() {
      this.intervalId = null;
      this.observer = null;
      this.isRunning = false;
      this.wasAdShowing = false;
      this.savedPlaybackRate = 1;
      this.savedMuted = false;

      this.onNavigate = this.onNavigate.bind(this);
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;

      this.tick();

      this.intervalId = setInterval(() => this.tick(), 100);

      window.addEventListener("yt-navigate-finish", this.onNavigate);
      window.addEventListener("spfdone", this.onNavigate);

      this.attachObserver();
    }

    onNavigate() {
      this.wasAdShowing = false;
      this.tick();
      this.attachObserver();
    }

    attachObserver() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      const target = document.querySelector("#movie_player, .html5-video-player") || document.body || document.documentElement;
      if (!target) return;

      this.observer = new MutationObserver(() => {
        this.tick();
      });
      this.observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
      });
    }

    triggerClick(el) {
      if (!el) return;
      try {
        el.click();
      } catch (_) {}
      try {
        const opts = { bubbles: true, cancelable: true, view: window };
        el.dispatchEvent(new PointerEvent("pointerdown", opts));
        el.dispatchEvent(new MouseEvent("mousedown", opts));
        el.dispatchEvent(new PointerEvent("pointerup", opts));
        el.dispatchEvent(new MouseEvent("mouseup", opts));
        el.dispatchEvent(new MouseEvent("click", opts));
      } catch (_) {}
    }

    clickSkipButtons() {
      const skipSelectors = [
        ".ytp-ad-skip-button-modern",
        ".ytp-skip-ad-button-modern",
        "button.ytp-ad-skip-button-modern",
        "button.ytp-skip-ad-button-modern",
        ".ytp-ad-skip-button",
        ".ytp-skip-ad-button",
        "button.ytp-ad-skip-button",
        "button.ytp-skip-ad-button",
        ".ytp-ad-skip-button-slot button",
        ".ytp-ad-skip-button-container button",
        "[id^='skip-button'] button",
        "[id^='skip-button']",
        ".videoAdUiSkipButton",
        "button[aria-label*='Skip']",
        "button[aria-label*='Bỏ qua']",
        "[class*='ytp-ad-skip-button']",
        "[class*='skip-button']"
      ];

      for (const sel of skipSelectors) {
        const found = document.querySelectorAll(sel);
        found.forEach((el) => {
          this.triggerClick(el);
          const childBtn = el.querySelector("button");
          if (childBtn) this.triggerClick(childBtn);
        });
      }

      // Search all buttons and spans containing "Bỏ qua" or "Skip"
      const candidates = document.querySelectorAll(
        "#movie_player button, .html5-video-player button, .ytp-ad-module button, [class*='skip'], [class*='Skip'], .ytp-button, span"
      );
      candidates.forEach((el) => {
        const text = (el.textContent || "").trim().toLowerCase();
        const aria = (el.getAttribute("aria-label") || "").toLowerCase();
        if (
          text === "bỏ qua" ||
          text.startsWith("bỏ qua") ||
          text === "skip" ||
          text.startsWith("skip") ||
          aria.includes("bỏ qua") ||
          aria.includes("skip")
        ) {
          const target = el.closest("button, [role='button']") || el;
          this.triggerClick(target);
        }
      });
    }

    checkIsAdShowing() {
      const player = document.querySelector("#movie_player, .html5-video-player");
      if (player && (player.classList.contains("ad-showing") || player.classList.contains("ad-interrupting"))) {
        return true;
      }
      if (document.querySelector(".ytp-ad-player-overlay, .ytp-ad-player-overlay-layout, .ytp-ad-text, [class*='ad-interrupting']")) {
        return true;
      }
      const skipBtn = document.querySelector(
        ".ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-skip-button, [class*='skip-button']"
      );
      if (skipBtn) return true;

      const adBadge = document.querySelector(".ytp-ad-badge, .ytp-ad-text, #movie_player [aria-label*='Được tài trợ']");
      if (adBadge) return true;

      return false;
    }

    tick() {
      this.handleVideoAds();
      this.handleAntiAdblock();
      this.removeFeedAds();
    }

    handleVideoAds() {
      const isAdShowing = this.checkIsAdShowing();
      const player = document.querySelector("#movie_player, .html5-video-player");
      const video = player
        ? player.querySelector("video")
        : (document.querySelector("video.html5-main-video") || document.querySelector("video"));

      this.clickSkipButtons();

      if (isAdShowing) {
        if (!this.wasAdShowing) {
          if (video) {
            this.savedPlaybackRate = (video.playbackRate > 0 && video.playbackRate <= 2) ? video.playbackRate : 1;
            this.savedMuted = Boolean(video.muted);
          }
          this.wasAdShowing = true;
        }

        if (video) {
          video.muted = true;
          video.playbackRate = 16.0;
          if (video.paused && !video.ended) {
            video.play().catch(() => {});
          }
        }

        const overlays = document.querySelectorAll(
          ".ytp-ad-player-overlay, .ytp-ad-player-overlay-layout, .ytp-ad-overlay-container, .ytp-ad-message-container, .ytp-ad-action-interstitial, .ytp-ad-image-overlay, .ytp-ad-overlay-slot"
        );
        overlays.forEach((el) => {
          if (el.style.display !== "none") {
            el.style.setProperty("display", "none", "important");
          }
        });
      } else if (this.wasAdShowing) {
        this.wasAdShowing = false;
        if (video) {
          video.playbackRate = this.savedPlaybackRate || 1;
          video.muted = this.savedMuted;
          if (video.paused && !video.ended) {
            video.play().catch(() => {});
          }
        }
      }

      const closeButtons = [
        ".ytp-ad-overlay-close-button",
        ".ytp-ad-overlay-close-container",
        ".ytp-ad-image-overlay button"
      ];
      for (const selector of closeButtons) {
        const closeBtn = document.querySelector(selector);
        if (closeBtn && typeof closeBtn.click === "function") {
          closeBtn.click();
        }
      }
    }

    removeFeedAds() {
      const adSlots = document.querySelectorAll(
        "ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-banner-promo-renderer, ytd-statement-banner-renderer, #masthead-ad, ytd-display-ad-renderer, ytd-promoted-sparkles-web-renderer, ytd-promoted-video-renderer, ytd-compact-promoted-video-renderer"
      );
      adSlots.forEach((slot) => {
        const container = slot.closest("ytd-rich-item-renderer, ytd-rich-section-renderer, ytd-video-renderer, ytd-compact-video-renderer") || slot;
        if (container.style.display !== "none") {
          container.style.setProperty("display", "none", "important");
        }
      });

      const allBadges = document.querySelectorAll(
        "#badge, .badge-shape-wiz__text, [aria-label*='Được tài trợ'], [aria-label*='Sponsored'], .ytd-badge-supported-renderer, yt-formatted-string.ytd-badge-supported-renderer"
      );
      allBadges.forEach((badge) => {
        const text = (badge.textContent || "").trim().toLowerCase();
        const aria = (badge.getAttribute("aria-label") || "").toLowerCase();
        if (
          text === "được tài trợ" ||
          text === "sponsored" ||
          text === "ad" ||
          aria.includes("được tài trợ") ||
          aria.includes("sponsored")
        ) {
          const container = badge.closest(
            "ytd-rich-item-renderer, ytd-rich-section-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-ad-slot-renderer, ytd-item-section-renderer"
          );
          if (container && container.style.display !== "none") {
            container.style.setProperty("display", "none", "important");
          }
        }
      });
    }

    handleAntiAdblock() {
      const enforcement = document.querySelector(
        "ytd-enforcement-message-view-model, tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)"
      );
      if (enforcement) {
        const dialog = enforcement.closest("tp-yt-paper-dialog") || enforcement;
        dialog.remove();

        const backdrops = document.querySelectorAll("tp-yt-iron-overlay-backdrop");
        backdrops.forEach((b) => b.remove());

        const video = document.querySelector("video.html5-main-video") || document.querySelector("video");
        if (video && video.paused) {
          video.play().catch(() => {});
        }
      }
    }

    stop() {
      this.isRunning = false;
      this.wasAdShowing = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      window.removeEventListener("yt-navigate-finish", this.onNavigate);
      window.removeEventListener("spfdone", this.onNavigate);
    }
  }

  root.UniversalAdBlockerYouTube = { YouTubeAdBlocker };
  if (typeof module !== "undefined") module.exports = { YouTubeAdBlocker };
})(typeof globalThis !== "undefined" ? globalThis : this);
