import { after, NextResponse, type NextRequest } from "next/server";
import { syncNewsletterContact } from "@/lib/newsletter/provider";
import {
  markNewsletterProviderSync,
  unsubscribeNewsletter,
  verifyUnsubscribeToken,
} from "@/lib/newsletter/server";

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") ?? 0) > 1_000) {
    return new NextResponse("Request too large", { status: 413 });
  }

  const formData = await request.formData();
  const token = formData.get("token");
  const redirectUrl = new URL("/newsletter/unsubscribed", request.url);
  const verified =
    typeof token === "string" ? verifyUnsubscribeToken(token) : null;

  if (!verified) {
    redirectUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const email = await unsubscribeNewsletter(verified);
  if (!email) {
    redirectUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(redirectUrl, 303);
  }

  after(async () => {
    try {
      const providerContactId = await syncNewsletterContact(email, true);
      if (providerContactId) {
        await markNewsletterProviderSync({
          subscriberId: verified.subscriberId,
          providerContactId,
        });
      }
    } catch (error) {
      console.warn("Newsletter unsubscribe synchronization failed:", error);
    }
  });

  redirectUrl.searchParams.set("status", "success");
  return NextResponse.redirect(redirectUrl, 303);
}
