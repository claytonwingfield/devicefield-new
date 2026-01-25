import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 1. Handle CORS
  const headers = {
    "Access-Control-Allow-Origin": "*", // In production, you might want to restrict this
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // 2. Parse the incoming data
  try {
    const body = await request.json();
    const { projectId, eventType, path, referrer } = body;

    if (!projectId || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers },
      );
    }

    // 3. Insert into Supabase
    const supabase = await createClient();

    // We use the service_role key pattern implicitly if this is a server component,
    // but typically you need to bypass RLS for public analytics ingestion
    // OR ensure your RLS policy allows public inserts.
    // For this example, we assume the supabase client here can write.

    const { error } = await supabase.from("analytics_events").insert([
      {
        project_id: projectId,
        event_type: eventType, // 'view' or 'click'
        page_path: path,
        referrer: referrer,
        user_agent: request.headers.get("user-agent"),
      },
    ]);

    if (error) {
      console.error("Analytics Error:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500, headers },
      );
    }

    return NextResponse.json({ success: true }, { status: 200, headers });
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers },
    );
  }
}

// Handle OPTIONS request for CORS preflight checks
export async function OPTIONS(request: Request) {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}
