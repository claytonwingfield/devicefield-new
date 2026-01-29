import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, company, message, service } = body;

    // 1. Setup Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 2. Email to YOU (Admin Notification)
    const mailToAdmin = {
      from: `"DeviceField Contact" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: `New Lead: ${name} - ${service || "General Inquiry"}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Company: ${company}
        Service: ${service}
        Message: ${message}
      `,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    };

    // 3. Email to USER (Confirmation)
    const mailToUser = {
      from: `"DeviceField Team" <${process.env.SMTP_USER}>`,
      to: email, // Send to the user who filled the form
      subject: "We received your message!",
      text: `Hi ${name},\n\nThank you for reaching out to DeviceField. We have received your inquiry regarding ${service || "our services"} and will get back to you shortly.\n\nBest regards,\nThe DeviceField Team`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Thanks for reaching out!</h2>
          <p>Hi ${name},</p>
          <p>We have received your message regarding <strong>${service || "our services"}</strong>.</p>
          <p>One of our team members will review your inquiry and get back to you shortly.</p>
          <br/>
          <p>Best regards,</p>
          <p><strong>The DeviceField Team</strong></p>
        </div>
      `,
    };

    // 4. Send both emails
    await Promise.all([
      transporter.sendMail(mailToAdmin),
      transporter.sendMail(mailToUser),
    ]);

    return NextResponse.json(
      { message: "Emails sent successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 },
    );
  }
}
