/**
 * Reassembles data/clarity.db from split parts (needed for hosts that reject
 * files larger than 10 MB, such as Netlify Drop).
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const target = join(dataDir, "clarity.db");

if (existsSync(target) && statSync(target).size > 0) {
  console.log("clarity.db already exists — skipping assembly");
  process.exit(0);
}

const parts = readdirSync(dataDir)
  .filter((name) => /^clarity\.db\.part\d+$/.test(name))
  .sort();

if (parts.length === 0) {
  console.error("No clarity.db and no parts found. Run `npm run seed` first.");
  process.exit(1);
}

const buffers = parts.map((name) => readFileSync(join(dataDir, name)));
writeFileSync(target, Buffer.concat(buffers));
console.log(`Assembled clarity.db from ${parts.length} parts (${buffers.reduce((s, b) => s + b.length, 0)} bytes)`);
