// app/api/schedule/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, startTime, notes } = body;

    // --- CREDENTIALS LOAD & CLEAN ---
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new Error("Missing Google Credentials in .env.local");
    }

    // CLEAN KEY
    privateKey = privateKey.replace(/^"|"$/g, "");
    if (privateKey.startsWith("GOOGLE_PRIVATE_KEY=")) {
      privateKey = privateKey.replace("GOOGLE_PRIVATE_KEY=", "");
    }
    privateKey = privateKey.replace(/\\n/g, "\n");

    // 1. Google Auth
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    await auth.authorize();
    console.log("2. Google Auth Successful.");

    const calendar = google.calendar({ version: "v3", auth });
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 30 * 60000);

    // 3. Create Event
    const eventResponse = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: `Intro Call: ${name}`,
        description: `Meeting with ${name} (${email}).\n\nNotes: ${notes}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
          },
        },
      },
    });

    const meetingLink =
      eventResponse.data.conferenceData?.entryPoints?.[0]?.uri ||
      eventResponse.data.htmlLink ||
      "";
    const eventId = eventResponse.data.id;

    console.log("3. Event Created:", eventId);

    // 4. Save to Supabase
    const supabase = await createClient();
    const { error: dbError } = await supabase.from("meetings").insert([
      {
        name,
        email,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        meeting_link: meetingLink,
        google_event_id: eventId,
      },
    ]);

    if (dbError) console.error("Supabase Error:", dbError);

    // 5. Send Email (FAIL-SAFE BLOCK)
    // If this fails, we log it but do NOT crash the response
    try {
      // FORCE SECURE for Port 465, or false for 587
      const isSecure = process.env.SMTP_PORT === "465";

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: isSecure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"DeviceField" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Meeting Confirmed - DeviceField",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #000;">Meeting Confirmed</h2>
            <p>Hi ${name},</p>
            <p>Your call is scheduled for <strong>${start.toLocaleString()}</strong>.</p>
            <p style="margin: 20px 0;">
              <a href="${meetingLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Meeting</a>
            </p>
            <p style="color: #666; font-size: 14px;">Link: <a href="${meetingLink}">${meetingLink}</a></p>
            <br/>
            <p>Best,<br/>The DeviceField Team</p>
          </div>
        `,
      });
      console.log("4. Email Sent Successfully");
    } catch (emailError: any) {
      console.error("EMAIL FAILED (But meeting booked):", emailError.message);
      // We purposefully do NOT throw error here so the user gets the success screen
    }

    return NextResponse.json({ success: true, meetingLink });
  } catch (error: any) {
    console.error("Schedule Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule" },
      { status: 500 },
    );
  }
}
