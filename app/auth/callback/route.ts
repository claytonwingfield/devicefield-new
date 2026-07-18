// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { getSameOriginUrl } from "@/lib/site-origin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/admin";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(getSameOriginUrl(request, next));
    }
  }

  // If there's an error or no code, return to home
  return NextResponse.redirect(getSameOriginUrl(request, "/"));
}
