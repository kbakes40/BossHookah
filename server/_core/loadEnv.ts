/**
 * Must be imported before any module that reads process.env (e.g. supabaseAdmin).
 * ESM evaluates static imports before the rest of the file, so .env cannot be loaded in index.ts body.
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });
