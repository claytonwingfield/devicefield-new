import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  SUPABASE_AUTH_COOKIE_ENCODING,
  SUPABASE_AUTH_COOKIE_OPTIONS,
} from './auth-cookies'

function getSupabaseServerKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseServerKey()!,
    {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
      cookieEncoding: SUPABASE_AUTH_COOKIE_ENCODING,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
