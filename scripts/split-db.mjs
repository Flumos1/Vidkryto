import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dataDir = "data";
const dbPath = join(dataDir, "clarity.db");
const chunkSize = 7_500_000;

for (const name of readdirSync(dataDir)) {
  if (/^clarity\.db\.part\d+$/.test(name)) unlinkSync(join(dataDir, name));
}

const buffer = readFileSync(dbPath);
let index = 0;
for (let offset = 0; offset < buffer.length; offset += chunkSize) {
  const part = buffer.subarray(offset, Math.min(offset + chunkSize, buffer.length));
  const name = `clarity.db.part${String(index).padStart(2, "0")}`;
  writeFileSync(join(dataDir, name), part);
  console.log(name, part.length);
  index++;
}
console.log(`Split ${buffer.length} bytes into ${index} parts`);
