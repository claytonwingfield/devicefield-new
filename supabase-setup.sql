-- Create contact_submissions table in Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on email for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- Optional: Enable Row Level Security (RLS) if you want to restrict access
-- ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy to allow inserts (if RLS is enabled)
-- CREATE POLICY "Allow public inserts" ON contact_submissions
--   FOR INSERT
--   TO anon, authenticated
--   WITH CHECK (true);

-- Optional: Create a policy to allow reads only for authenticated users (if RLS is enabled)
-- CREATE POLICY "Allow authenticated reads" ON contact_submissions
--   FOR SELECT
--   TO authenticated
--   USING (true);
