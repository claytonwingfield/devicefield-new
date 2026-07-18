import { after, NextResponse, type NextRequest } from "next/server";
import {
  sendNewsletterWelcome,
  syncNewsletterContact,
} from "@/lib/newsletter/provider";
import {
  confirmNewsletterSubscription,
  createUnsubscribeToken,
  hashNewsletterValue,
  markNewsletterProviderSync,
} from "@/lib/newsletter/server";
import { getSameOriginUrl } from "@/lib/site-origin";

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") ?? 0) > 1_000) {
    return new NextResponse("Request too large", { status: 413 });
  }

  const formData = await request.formData();
  const token = formData.get("token");
  const redirectUrl = getSameOriginUrl(request, "/newsletter/confirmed");

  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) {
    redirectUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const subscriber = await confirmNewsletterSubscription(
    hashNewsletterValue(token),
  );
  if (!subscriber) {
    redirectUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const unsubscribeToken = createUnsubscribeToken(
    subscriber.subscriber_id,
    subscriber.token_version,
  );

  after(async () => {
    try {
      const providerContactId = await syncNewsletterContact(
        subscriber.subscriber_email,
        false,
      );
      if (providerContactId) {
        await markNewsletterProviderSync({
          subscriberId: subscriber.subscriber_id,
          providerContactId,
        });
      }
      if (unsubscribeToken) {
        await sendNewsletterWelcome({
          email: subscriber.subscriber_email,
          unsubscribeToken,
        });
      }
    } catch (error) {
      console.warn("Post-confirmation newsletter sync failed:", error);
    }
  });

  return NextResponse.redirect(getSameOriginUrl(request, "/"), 303);
}
