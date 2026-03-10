import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionUser = { id: string; email: string };

export async function validateSession(
  supabase: SupabaseClient,
  token?: string,
): Promise<SessionUser | null> {
  const { data } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
}
