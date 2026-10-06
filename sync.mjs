#!/usr/bin/env node
/**
 * Copy the dataset into a demo, or check that a demo's copy is current.
 *
 *   node sync.mjs ../demo-price-sync          write lib/harbour/ in that demo
 *   node sync.mjs ../demo-price-sync --check  exit 1 if its copy differs
 *
 * The copy carries a VERSION file with a hash of the sources, so a demo's own
 * self-test can tell whether somebody edited its copy by hand instead of here.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "src");
const files = readdirSync(SRC).filter((f) => f.endsWith(".js")).sort();
const hash = createHash("sha256");
for (const f of files) hash.update(f).update(readFileSync(path.join(SRC, f)));
const version = hash.digest("hex").slice(0, 16);

const target = process.argv[2];
const checkOnly = process.argv.includes("--check");
if (!target) {
  console.log(`harbour-data ${version} (${files.length} files)`);
  process.exit(0);
}

const dest = path.join(path.resolve(target), "lib", "harbour");
if (checkOnly) {
  const current = existsSync(path.join(dest, "VERSION")) ? readFileSync(path.join(dest, "VERSION"), "utf8").trim() : "none";
  const same = current === version && files.every((f) => existsSync(path.join(dest, f))
    && readFileSync(path.join(dest, f), "utf8") === readFileSync(path.join(SRC, f), "utf8"));
  console.log(same ? `${target}: current (${version})` : `${target}: STALE (has ${current}, source is ${version})`);
  process.exit(same ? 0 : 1);
}

mkdirSync(dest, { recursive: true });
for (const f of files) writeFileSync(path.join(dest, f), readFileSync(path.join(SRC, f)));
writeFileSync(path.join(dest, "VERSION"), `${version}\n`);
console.log(`wrote ${files.length} files to ${dest} (${version})`);
