import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_AUTH_COOKIE_ENCODING,
  SUPABASE_AUTH_COOKIE_OPTIONS,
} from "@/lib/supabase/auth-cookies";

type SupabaseCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function getSupabaseServerKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function isFormRequest(request: Request) {
  return request.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/x-www-form-urlencoded");
}

function getRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin?.startsWith("http")) return origin;

  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost && !forwardedHost.startsWith("0.0.0.0")) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return "https://devicefield.com";
}

function getPublicUrl(request: Request, path: string) {
  return new URL(path, getRequestOrigin(request));
}

function withAuthCookies(response: NextResponse, cookiesToSet: SupabaseCookie[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      path: options.path ?? "/",
    });
  });

  return response;
}

function redirectToLogin(
  request: Request,
  error: string,
  cookiesToSet: SupabaseCookie[] = [],
) {
  const url = getPublicUrl(request, "/devicefield-editor-login");
  url.searchParams.set("error", error);
  return withAuthCookies(NextResponse.redirect(url, 303), cookiesToSet);
}

function redirectToAdminAfterCookies(
  request: Request,
  cookiesToSet: SupabaseCookie[],
) {
  return withAuthCookies(
    NextResponse.redirect(getPublicUrl(request, "/admin"), 303),
    cookiesToSet,
  );
}

function createRouteSupabaseClient(request: NextRequest) {
  const cookiesToSet: SupabaseCookie[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabaseServerKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
    cookieEncoding: SUPABASE_AUTH_COOKIE_ENCODING,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(newCookies) {
        cookiesToSet.push(...newCookies);
      },
    },
  });

  return { supabase, cookiesToSet };
}

export async function POST(request: NextRequest) {
  const isForm = isFormRequest(request);
  const body = isForm
    ? Object.fromEntries(await request.formData())
    : ((await request.json().catch(() => null)) as
        | { email?: unknown; password?: unknown }
        | null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    if (isForm) {
      return redirectToLogin(request, "Email and password are required.");
    }

    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const { supabase, cookiesToSet } = createRouteSupabaseClient(request);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    const message = error?.message ?? "Invalid login credentials";
    if (isForm) {
      return redirectToLogin(request, message);
    }

    return NextResponse.json(
      { error: message },
      { status: 401 },
    );
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    await supabase.auth.signOut();
    const message = "This account is not configured as a Devicefield admin.";

    if (isForm) {
      return redirectToLogin(request, message, cookiesToSet);
    }

    return withAuthCookies(
      NextResponse.json({ error: message }, { status: 403 }),
      cookiesToSet,
    );
  }

  if (isForm) {
    return redirectToAdminAfterCookies(request, cookiesToSet);
  }

  return withAuthCookies(NextResponse.json({ ok: true }), cookiesToSet);
}
