import type { Context } from "@my-app/api/trpc";
import { createSupabaseServerClient } from "@my-app/auth/server";
import { validateSession } from "@my-app/auth/session";
import { cookies } from "next/headers";

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;
  const user = await validateSession(supabase, token);
  return { supabase, user };
}
