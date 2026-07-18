export const SUPABASE_AUTH_COOKIE_OPTIONS = {
  // Firebase Hosting only forwards this cookie name to the SSR function.
  name: "__session",
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
} as const;

// Raw encoding keeps the Firebase-supported cookie below the chunking limit.
export const SUPABASE_AUTH_COOKIE_ENCODING = "raw" as const;
