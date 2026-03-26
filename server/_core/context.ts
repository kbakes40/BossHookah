import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { TrpcUser } from "@shared/trpcUser";
import { getTrpcUserById, syncProfileFromAuthUser } from "./profiles";
import { supabaseAdmin } from "./supabaseAdmin";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: TrpcUser | null;
};

/**
 * Extract the Supabase access token from the Authorization: Bearer header.
 * Uses Express `req.get` when present (case-insensitive) so proxies / runtimes
 * that only surface `Authorization` in one form still authenticate.
 */
export function extractBearerTokenFromHeaders(headers: {
  authorization?: string | undefined;
}): string | null {
  const authHeader = headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function extractBearerFromExpressReq(
  req: Pick<CreateExpressContextOptions["req"], "headers" | "get">
): string | null {
  let raw: string | undefined;
  if (typeof req.get === "function") {
    raw = req.get("Authorization") ?? undefined;
  }
  raw ??= req.headers.authorization;
  if (!raw?.trim()) return null;
  const m = /^Bearer\s+(\S+)/i.exec(raw.trim());
  return m?.[1]?.trim() ?? null;
}

export async function getTrpcUserFromExpressRequest(
  req: Pick<CreateExpressContextOptions["req"], "headers" | "get">
): Promise<TrpcUser | null> {
  try {
    const token = extractBearerFromExpressReq(req);
    if (!token) return null;
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user) {
      await syncProfileFromAuthUser(data.user);
      return await getTrpcUserById(data.user.id);
    }
  } catch {
    return null;
  }
  return null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await getTrpcUserFromExpressRequest(opts.req);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
