// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Admin client to bypass RLS for account creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    );
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;
    const customerId = session.customer as string;

    if (!customerEmail) return NextResponse.json({ error: "No email found" });

    // 1. Check if user exists in Supabase
    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", customerEmail)
      .single();

    let userId = existingUser?.id;

    // 2. If NO user, create a new account automatically
    if (!userId) {
      // Create auth user with a random password (they will reset it)
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true, // Auto-confirm since they just paid
          user_metadata: { full_name: session.customer_details?.name },
        });

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "User creation failed" },
          { status: 500 },
        );
      }

      userId = newUser.user.id;

      // Send a password reset email so they can "claim" the account
      await supabaseAdmin.auth.resetPasswordForEmail(customerEmail, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`,
      });
    }

    // 3. Update Profile with Subscription Data
    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_customer_id: customerId,
        subscription_status: "active",
        subscription_plan: "yearly", // You can pull this dynamically from session line items
      })
      .eq("id", userId);
  }

  return NextResponse.json({ received: true });
}
