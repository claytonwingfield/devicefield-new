import { NextResponse, type NextRequest } from "next/server";
import { syncNewsletterContact } from "@/lib/newsletter/provider";
import { markNewsletterProviderSync } from "@/lib/newsletter/server";
import { hasAllowedRequestOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!hasAllowedRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Newsletter synchronization request rejected." },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id,email")
    .eq("status", "subscribed")
    .order("created_at", { ascending: true })
    .limit(2_000);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let synchronized = 0;
  const failed: string[] = [];
  for (const subscriber of data ?? []) {
    const providerContactId = await syncNewsletterContact(
      subscriber.email,
      false,
    );
    if (!providerContactId) {
      failed.push(subscriber.id);
      continue;
    }
    const marked = await markNewsletterProviderSync({
      subscriberId: subscriber.id,
      providerContactId,
    });
    if (marked) synchronized += 1;
    else failed.push(subscriber.id);
  }

  return NextResponse.json(
    { synchronized, failed: failed.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
