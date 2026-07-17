import { createBrowserClient } from '@supabase/ssr'

function getSupabaseBrowserKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = getSupabaseBrowserKey()

  if ((!supabaseUrl || !supabaseKey) && typeof window !== 'undefined') {
    throw new Error('Supabase browser environment variables are not configured')
  }

  return createBrowserClient(
    supabaseUrl ?? 'https://placeholder.supabase.co',
    supabaseKey ?? 'placeholder-publishable-key'
  )
}
