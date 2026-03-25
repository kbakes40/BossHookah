#!/usr/bin/env node
/**
 * Production client build into dist/public (Manus / SPA mirror).
 * Uses vite.config.ts (Manus runtime + default app build).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync("pnpm", ["exec", "vite", "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
