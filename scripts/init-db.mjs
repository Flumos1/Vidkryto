/**
 * Prepares a writable database for persistent-disk deployments.
 * Copies the snapshot built into the image/repo to DB_FILE when it is missing.
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const target = process.env.DB_FILE || path.join(cwd, "data", "clarity.db");
const seed = process.env.SEED_DB || path.join(cwd, "data", "clarity.db");

if (existsSync(target) && statSync(target).size > 0) {
  console.log(`[init-db] database already exists: ${target}`);
  process.exit(0);
}

if (!existsSync(seed)) {
  console.error(`[init-db] seed database not found: ${seed}`);
  console.error("[init-db] run `npm run seed` or `node scripts/assemble-db.mjs` first");
  process.exit(1);
}

mkdirSync(path.dirname(target), { recursive: true });
if (path.resolve(seed) !== path.resolve(target)) {
  copyFileSync(seed, target);
}
console.log(`[init-db] initialized ${target} from ${seed}`);
