# Services Pages & Contact Form Setup

## Overview

This project now includes dedicated "Learn More" pages for each service and a contact form system for customer inquiries.

## Services Pages

Each service has its own dedicated page with detailed information:

1. **Website Development** - `/services/website-development`
2. **App Development** - `/services/app-development`
3. **API Development** - `/services/api-development`
4. **Instant Analytics** - `/services/analytics`
5. **Metadata** - `/services/metadata`
6. **SEO & Performance** - `/services/seo-performance`

## Features

### Service Pages Include:
- Hero section with service icon and description
- Key features grid
- Benefits list
- Use cases (where applicable)
- Contact form pre-filled with service name

### Contact Form Features:
- Name, email, phone, company fields
- Service selection (auto-filled on service pages)
- Message textarea
- Form validation
- Success/error messaging
- Submissions stored in Supabase

## Setup Instructions

### 1. Create Supabase Table

Run the SQL script in your Supabase SQL Editor:

```bash
# The SQL script is located at: supabase-setup.sql
```

Or manually create the table using the SQL in `supabase-setup.sql`.

### 2. Environment Variables

Make sure your `.env.local` file has the Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Test the Contact Form

1. Navigate to any service page (e.g., `/services/website-development`)
2. Scroll to the bottom to see the contact form
3. Fill out and submit the form
4. Check your Supabase `contact_submissions` table to see the submission

## File Structure

```
app/
  services/
    website-development/
      page.tsx
    app-development/
      page.tsx
    api-development/
      page.tsx
    analytics/
      page.tsx
    metadata/
      page.tsx
    seo-performance/
      page.tsx
  api/
    contact/
      route.ts          # API endpoint for form submissions

components/
  contact-form.tsx      # Reusable contact form component
  service-layout.tsx    # Shared layout for service pages
  features-planet.tsx  # Updated with "Learn More" links
```

## API Endpoint

The contact form submits to `/api/contact` which:
- Validates required fields
- Stores submissions in Supabase `contact_submissions` table
- Returns success/error responses

## Next Steps

### Email Notifications
To receive email notifications when forms are submitted, you can:

1. **Use Supabase Edge Functions** - Create a database trigger that sends emails
2. **Use a service like Resend** - Add email sending to the API route
3. **Use Supabase Realtime** - Set up real-time notifications

### Example: Adding Resend Email Service

```typescript
// In app/api/contact/route.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// After storing in Supabase, send email:
await resend.emails.send({
  from: 'contact@devicefield.com',
  to: 'your-email@example.com',
  subject: `New Contact Form Submission: ${service}`,
  html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p>`,
});
```

## Customization

### Updating Service Content
Edit the individual service page files in `app/services/[service-name]/page.tsx`

### Styling
The service pages use the existing Tailwind CSS classes. Modify `components/service-layout.tsx` to change the layout.

### Form Fields
Edit `components/contact-form.tsx` to add/remove form fields.

## Links from Homepage

The features section on the homepage now includes "Learn More" links that navigate to the respective service pages. These links are automatically added to each service card in `components/features-planet.tsx`.
