/**
 * Copies the repo-root published/ directory into frontend/public/data/
 * so the app can fetch it as static JSON at runtime. Runs automatically
 * before `dev` and `build`. Idempotent.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../../published");
const DEST = path.resolve(__dirname, "../public/data");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(SRC))) {
    console.warn(
      `⚠️  No published/ directory found at ${SRC}.\n` +
        `   Run the pipeline first (or: npx tsx scripts/mock-run.ts && analyze + publish).\n` +
        `   The frontend will start but show an empty state.`
    );
    await fs.mkdir(DEST, { recursive: true });
    return;
  }
  await fs.rm(DEST, { recursive: true, force: true });
  await fs.cp(SRC, DEST, { recursive: true });
  console.log(`✅ Synced published/ → ${path.relative(process.cwd(), DEST)}`);
}

main().catch((err) => {
  console.error("sync-data failed:", err);
  process.exit(1);
});
