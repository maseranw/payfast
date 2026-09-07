const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "../dist");

const specifierPattern = /((?:from|import)\s+["'])(\.\.?\/[^"']+?)(["'])/g;

const resolveSpecifier = (fileDir, specifier) => {
  if (/\.[a-zA-Z0-9]+$/.test(specifier)) {
    return specifier;
  }
  const target = path.resolve(fileDir, specifier);
  if (fs.existsSync(`${target}.js`)) {
    return `${specifier}.js`;
  }
  if (fs.existsSync(path.join(target, "index.js"))) {
    return `${specifier}/index.js`;
  }
  return `${specifier}.js`;
};

const rewriteFile = (filePath) => {
  const original = fs.readFileSync(filePath, "utf8");
  const fileDir = path.dirname(filePath);
  const rewritten = original.replace(
    specifierPattern,
    (match, prefix, specifier, suffix) => `${prefix}${resolveSpecifier(fileDir, specifier)}${suffix}`
  );
  if (rewritten !== original) {
    fs.writeFileSync(filePath, rewritten);
  }
};

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "cjs") continue;
      walk(entryPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      rewriteFile(entryPath);
    }
  }
};

walk(distDir);
