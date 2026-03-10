import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

type Provider = "google" | "apple" | "github";

export async function signInWithOAuth(provider: Provider) {
  const redirectUrl = Linking.createURL("/auth/callback");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("No OAuth URL returned");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type === "success") {
    const { url } = result;
    const params = new URL(url);
    const code = params.searchParams.get("code");

    if (code) {
      const { error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) throw sessionError;
    }
  }
}
