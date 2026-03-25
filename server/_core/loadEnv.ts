/**
 * Must be imported before any module that reads process.env (e.g. supabaseAdmin).
 * ESM evaluates static imports before the rest of the file, so .env cannot be loaded in index.ts body.
 */
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  return dotenv.parse(fs.readFileSync(filePath));
}

const baseParsed = parseEnvFile(path.join(repoRoot, ".env"));
const localParsed = parseEnvFile(path.join(repoRoot, ".env.local"));

const merged: Record<string, string> = { ...baseParsed, ...localParsed };

/** Placeholder keys in `.env.local` (e.g. `PAYPAL_SECRET=`) must not erase real values from `.env`. */
for (const key of Object.keys(localParsed)) {
  if (
    localParsed[key] === "" &&
    baseParsed[key] !== undefined &&
    baseParsed[key] !== ""
  ) {
    merged[key] = baseParsed[key]!;
  }
}

for (const [key, value] of Object.entries(merged)) {
  process.env[key] = value;
}
