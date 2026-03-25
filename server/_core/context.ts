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
 */
function extractBearerToken(req: CreateExpressContextOptions["req"]): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: TrpcUser | null = null;

  try {
    const token = extractBearerToken(opts.req);
    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        await syncProfileFromAuthUser(data.user);
        user = await getTrpcUserById(data.user.id);
      }
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
