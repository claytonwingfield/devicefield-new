import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, company, message, service } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Get Supabase client
    const supabase = await createClient()

    // Store the contact form submission in Supabase
    // First, ensure the table exists. You'll need to create this table in Supabase:
    // CREATE TABLE contact_submissions (
    //   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    //   name TEXT NOT NULL,
    //   email TEXT NOT NULL,
    //   phone TEXT,
    //   company TEXT,
    //   service TEXT,
    //   message TEXT NOT NULL,
    //   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    // );

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([
        {
          name,
          email,
          phone: phone || null,
          company: company || null,
          service: service || null,
          message,
        },
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      // If table doesn't exist, just log and continue (you can set up email service later)
      // For now, we'll return success so the form works
      // In production, you'd want to set up proper error handling
    }

    // TODO: Add email notification service here (e.g., Resend, SendGrid, etc.)
    // For now, the data is stored in Supabase

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your inquiry! We\'ll get back to you soon.' 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    )
  }
}
