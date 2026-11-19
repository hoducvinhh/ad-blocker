const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const distRoot = path.join(root, "dist");
const target = process.argv[2];

function clean() {
  fs.rmSync(distRoot, { recursive: true, force: true });
  console.log("Cleaned dist/");
}

function copyRecursive(source, destination) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    fs.readdirSync(source).forEach((entry) => {
      copyRecursive(path.join(source, entry), path.join(destination, entry));
    });
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function validateManifest(manifest, browser) {
  if (manifest.manifest_version !== 3) throw new Error(`${browser}: manifest must be V3`);
  if (!manifest.background || !manifest.background.service_worker) throw new Error(`${browser}: service worker missing`);
  if (!manifest.action || !manifest.action.default_popup) throw new Error(`${browser}: popup missing`);
  if (!manifest.content_scripts || !manifest.content_scripts.length) throw new Error(`${browser}: content script missing`);
}

function build(browser) {
  const destination = path.join(distRoot, browser);
  fs.mkdirSync(destination, { recursive: true });

  copyRecursive(path.join(root, "src"), path.join(destination, "src"));
  copyRecursive(path.join(root, "filters"), path.join(destination, "filters"));
  if (fs.existsSync(path.join(root, "assets"))) {
    copyRecursive(path.join(root, "assets"), path.join(destination, "assets"));
  }

  const manifestPath = path.join(root, "manifests", `${browser}.json`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  validateManifest(manifest, browser);
  fs.writeFileSync(path.join(destination, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Built dist/${browser}`);
}

if (target === "clean") {
  clean();
} else if (target === "chrome" || target === "edge") {
  fs.mkdirSync(distRoot, { recursive: true });
  build(target);
} else {
  console.error("Usage: node scripts/build.js <chrome|edge|clean>");
  process.exit(1);
}
