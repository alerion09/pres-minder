import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.ssr.ts";

// Public paths - Auth pages and API endpoints
const PUBLIC_PATHS = [
  // Auth pages
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset/request",
  "/api/auth/reset/confirm",
  "/api/auth/account",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create per-request SSR client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Assign to locals for use in pages and API routes
  locals.supabase = supabase;

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Assign user to locals if authenticated
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email,
    };
  }

  // Skip redirect for API routes - let endpoints handle authorization
  if (url.pathname.startsWith("/api/")) {
    return next();
  }

  // Redirect to login for protected routes if not authenticated
  if (!user && !PUBLIC_PATHS.includes(url.pathname)) {
    return redirect("/login");
  }

  return next();
});
