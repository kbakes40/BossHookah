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
export function extractBearerTokenFromHeaders(headers: {
  authorization?: string | undefined;
}): string | null {
  const authHeader = headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function getTrpcUserFromExpressRequest(
  req: Pick<CreateExpressContextOptions["req"], "headers">
): Promise<TrpcUser | null> {
  try {
    const token = extractBearerTokenFromHeaders(req.headers);
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
