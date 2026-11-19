const test = require("node:test");
const assert = require("node:assert/strict");
const { YouTubeAdBlocker } = require("../../src/content/youtube-ad-blocker.js");

function createMockElement(tagName = "div") {
  const classList = new Set();
  const children = [];
  return {
    tagName: tagName.toUpperCase(),
    classList: {
      contains: (cls) => classList.has(cls),
      add: (cls) => classList.add(cls),
      remove: (cls) => classList.delete(cls)
    },
    children,
    parentElement: null,
    style: {
      display: "",
      setProperty(prop, val) {
        if (prop === "display") this.display = val;
      }
    },
    textContent: "",
    attributes: {},
    getAttribute(attr) {
      return this.attributes[attr] || null;
    },
    closest(selector) {
      return this;
    },
    remove() {
      this.removed = true;
    },
    clickCalled: 0,
    click() {
      this.clickCalled += 1;
    },
    querySelector(selector) {
      if (selector === "video" && this.video) return this.video;
      return null;
    }
  };
}

test("YouTubeAdBlocker handles and speeds up video ads safely with one-time skip guard", () => {
  const blocker = new YouTubeAdBlocker();

  const mockVideo = {
    playbackRate: 1.0,
    muted: false,
    duration: 30,
    currentTime: 2,
    paused: false,
    playCalled: 0,
    play() {
      this.playCalled += 1;
      return Promise.resolve();
    }
  };

  const mockPlayer = createMockElement("div");
  mockPlayer.classList.add("ad-showing");
  mockPlayer.video = mockVideo;

  const mockSkipBtn = createMockElement("button");

  global.window = {
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  global.document = {
    querySelector: (selector) => {
      if (selector === "#movie_player, .html5-video-player") return mockPlayer;
      if (selector.includes("video")) return mockVideo;
      if (selector.includes("skip")) return mockSkipBtn;
      return null;
    },
    querySelectorAll: () => []
  };

  // First tick: ad is showing
  blocker.tick();

  assert.equal(blocker.wasAdShowing, true);
  assert.equal(blocker.adSkipped, true);
  assert.equal(mockVideo.muted, true);
  assert.equal(mockVideo.playbackRate, 16.0);
  assert.equal(mockSkipBtn.clickCalled, 1);
  assert.equal(mockVideo.currentTime, 30);

  // Next tick: ad ended
  mockPlayer.classList.remove("ad-showing");
  blocker.tick();

  assert.equal(blocker.wasAdShowing, false);
  assert.equal(blocker.adSkipped, false);
  assert.equal(mockVideo.playbackRate, 1.0);
  assert.equal(mockVideo.muted, false);
});

test("YouTubeAdBlocker NEVER skips normal video when no ad is showing", () => {
  const blocker = new YouTubeAdBlocker();

  const mockVideo = {
    playbackRate: 1.0,
    muted: false,
    duration: 600,
    currentTime: 10,
    paused: false
  };

  const mockPlayer = createMockElement("div");
  // Player does NOT have ad-showing
  mockPlayer.video = mockVideo;

  global.window = {
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  global.document = {
    querySelector: (selector) => {
      if (selector === "#movie_player, .html5-video-player") return mockPlayer;
      if (selector.includes("video")) return mockVideo;
      return null;
    },
    querySelectorAll: () => []
  };

  blocker.tick();

  assert.equal(blocker.wasAdShowing, false);
  assert.equal(mockVideo.currentTime, 10);
  assert.equal(mockVideo.playbackRate, 1.0);
  assert.equal(mockVideo.muted, false);
});

test("YouTubeAdBlocker removes sponsored feed ads", () => {
  const blocker = new YouTubeAdBlocker();

  const mockFeedItem = createMockElement("ytd-rich-item-renderer");
  const mockBadge = createMockElement("div");
  mockBadge.textContent = "Được tài trợ";
  mockBadge.closest = (sel) => mockFeedItem;

  global.document = {
    querySelector: () => null,
    querySelectorAll: (selector) => {
      if (selector.includes("badge")) return [mockBadge];
      return [];
    }
  };

  blocker.removeFeedAds();

  assert.equal(mockFeedItem.style.display, "none");
});

test("YouTubeAdBlocker handles anti-adblock enforcement dialog", () => {
  const blocker = new YouTubeAdBlocker();

  const mockVideo = {
    paused: true,
    playCalled: 0,
    play() {
      this.playCalled += 1;
      this.paused = false;
      return Promise.resolve();
    }
  };

  const mockDialog = createMockElement("tp-yt-paper-dialog");
  const mockBackdrop = createMockElement("tp-yt-iron-overlay-backdrop");

  global.document = {
    querySelector: (selector) => {
      if (selector.includes("enforcement")) return mockDialog;
      if (selector.includes("video")) return mockVideo;
      return null;
    },
    querySelectorAll: (selector) => {
      if (selector.includes("backdrop")) return [mockBackdrop];
      return [];
    }
  };

  blocker.handleAntiAdblock();

  assert.equal(mockDialog.removed, true);
  assert.equal(mockBackdrop.removed, true);
  assert.equal(mockVideo.playCalled, 1);
});
