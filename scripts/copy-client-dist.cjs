const fs = require("fs");
const path = require("path");

const root = process.cwd();
const candidates = [
  {
    from: path.join(root, "client", "dist"),
    to: path.join(root, "dist"),
  },
  {
    from: path.join(root, "dist"),
    to: path.join(root, "client", "dist"),
  },
];

function copyDirectory(from, to) {
  if (!fs.existsSync(from)) {
    return false;
  }

  fs.rmSync(to, { recursive: true, force: true });
  copyRecursive(from, to);
  console.log(`Copied build output: ${path.relative(root, from)} -> ${path.relative(root, to)}`);
  return true;
}

function copyRecursive(from, to) {
  const stats = fs.statSync(from);

  if (stats.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from)) {
      copyRecursive(path.join(from, entry), path.join(to, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

const copied = candidates.some(({ from, to }) => copyDirectory(from, to));

if (!copied) {
  console.log("No build output to copy; continuing.");
}
