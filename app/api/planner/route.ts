import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { services, budget, timeline, type, contact, pricingModel } = body;

    if (!contact?.name || !contact?.email) {
      return NextResponse.json(
        { error: "Contact information is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("project_inquiries").insert([
      {
        services,
        budget_range: budget,
        pricing_model: pricingModel, // Save the toggle selection
        timeline,
        project_type: type,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        additional_details: contact.message,
      },
    ]);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: "Project inquiry received" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Planner error:", error);
    return NextResponse.json(
      { error: "Failed to save inquiry" },
      { status: 500 },
    );
  }
}
