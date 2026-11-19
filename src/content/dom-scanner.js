(function (root) {
  "use strict";

  class DomScanner {
    constructor(rules) {
      this.rules = rules || [];
      this.processed = new WeakSet();
      this.hiddenCount = 0;
      this.queue = [];
      this.scheduled = false;
      this.observer = null;
    }

    hideElement(element) {
      if (!(element instanceof Element) || this.processed.has(element)) return;
      this.processed.add(element);
      if (element.classList.contains("universal-ad-blocker-hidden")) return;

      const originalDisplay = element.style.getPropertyValue("display");
      const originalPriority = element.style.getPropertyPriority("display");
      element.setAttribute("data-uab-original-display", originalDisplay || "");
      element.setAttribute("data-uab-original-display-priority", originalPriority || "");
      element.classList.add("universal-ad-blocker-hidden");
      element.style.setProperty("display", "none", "important");
      this.hiddenCount += 1;
    }

    scanRoot(rootNode) {
      if (!rootNode) return;
      this.rules.forEach((selector) => {
        let matches = [];
        try {
          if (rootNode.nodeType === 1 && rootNode.matches(selector)) matches.push(rootNode);
          if (rootNode.querySelectorAll) matches = matches.concat(Array.from(rootNode.querySelectorAll(selector)));
        } catch (_) {
          return;
        }
        matches.slice(0, 200).forEach((element) => this.hideElement(element));
      });
    }

    scanDocument() {
      this.scanRoot(document.documentElement);
    }

    enqueueNodes(nodes) {
      nodes.forEach((node) => {
        if (node && node.nodeType === 1) this.queue.push(node);
      });
      if (!this.scheduled) {
        this.scheduled = true;
        const runner = () => {
          this.scheduled = false;
          const batch = this.queue.splice(0, 100);
          batch.forEach((node) => this.scanRoot(node));
          if (this.queue.length) this.schedule();
        };
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(runner, { timeout: 500 });
        } else {
          setTimeout(runner, 150);
        }
      }
    }

    schedule() {
      if (this.scheduled) return;
      this.scheduled = true;
      setTimeout(() => {
        this.scheduled = false;
        const batch = this.queue.splice(0, 100);
        batch.forEach((node) => this.scanRoot(node));
        if (this.queue.length) this.schedule();
      }, 150);
    }

    start() {
      this.scanDocument();
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          this.enqueueNodes(Array.from(mutation.addedNodes));
        });
      });
      this.observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    stop() {
      if (this.observer) this.observer.disconnect();
      document.querySelectorAll(".universal-ad-blocker-hidden").forEach((element) => {
        const original = element.getAttribute("data-uab-original-display") || "";
        const priority = element.getAttribute("data-uab-original-display-priority") || "";
        element.classList.remove("universal-ad-blocker-hidden");
        element.removeAttribute("data-uab-original-display");
        element.removeAttribute("data-uab-original-display-priority");
        if (original) {
          element.style.setProperty("display", original, priority);
        } else {
          element.style.removeProperty("display");
        }
      });
    }
  }

  root.UniversalAdBlockerDomScanner = { DomScanner };
  if (typeof module !== "undefined") module.exports = { DomScanner };
})(typeof globalThis !== "undefined" ? globalThis : this);
