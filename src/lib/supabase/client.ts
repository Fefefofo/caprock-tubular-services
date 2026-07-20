import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    requireBrowserEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireBrowserEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

function requireBrowserEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) {
  const value =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}
