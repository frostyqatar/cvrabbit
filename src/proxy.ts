import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  SITE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

const PROTECTED_PREFIXES = ["/dashboard", "/cv"];

function canonicalHost(): string {
  if (!SITE_URL) return "";
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "";
  }
}

const CANONICAL_HOST = canonicalHost();

export async function proxy(request: NextRequest) {
  // Keep the PKCE verifier cookie and Supabase's redirect allow-list on one
  // canonical production host. Deployment-specific URLs otherwise break OAuth.
  if (process.env.VERCEL_ENV === "production" && CANONICAL_HOST) {
    const host = request.headers.get("host")?.split(":")[0] ?? "";
    if (host && host !== CANONICAL_HOST && host.endsWith(".vercel.app")) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.host = CANONICAL_HOST;
      return NextResponse.redirect(url, 308);
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let hasUser = false;
  try {
    const { data } = await supabase.auth.getClaims();
    hasUser = Boolean(data?.claims?.sub);
  } catch {
    // Treat a failed verification as signed out. The route itself will also check.
    hasUser = false;
  }

  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!hasUser && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (hasUser && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|pdf.worker|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|mjs)$).*)",
  ],
};
