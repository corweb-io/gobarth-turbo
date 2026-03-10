import { createBrowserClient } from "@my-app/auth/client";

type Provider = "google" | "apple" | "github";

export async function signInWithOAuth(provider: Provider) {
  const supabase = createBrowserClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}
