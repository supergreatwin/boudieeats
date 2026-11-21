import { createClient } from "npm:@supabase/supabase-js@2.119.1";

const allowedOrigins = new Set([
  "https://boudieeats.com",
  "https://www.boudieeats.com",
]);
const responseText = "If an account exists, a password reset email will be sent if the request is eligible.";
const encoder = new TextEncoder();

function responseHeaders(origin: string | null): Headers {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Vary": "Origin",
  });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

function anonymousResponse(origin: string | null): Response {
  return new Response(JSON.stringify({ message: responseText }), {
    status: 200,
    headers: responseHeaders(origin),
  });
}

async function identityHash(
  key: CryptoKey,
  category: "email" | "ip",
  value: string,
): Promise<string> {
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(category + ":" + value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

function clientIp(request: Request): string {
  // Supabase's Cloudflare edge sets CF-Connecting-IP. Do not use the
  // spoofable FIRST value in X-Forwarded-For; use the rightmost fallback.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const candidate = (request.headers.get("cf-connecting-ip") || forwarded || "").trim();
  return candidate.length > 0 && candidate.length <= 64 && /^[0-9a-fA-F:.]+$/.test(candidate)
    ? candidate.toLowerCase()
    : "unavailable"; // Fail closed to a shared, rate-limited bucket.
}

Deno.serve(async (request: Request): Promise<Response> => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(origin) });
  }
  if (request.method !== "POST" || (origin && !allowedOrigins.has(origin))) {
    return anonymousResponse(origin);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return anonymousResponse(origin);
    }

    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    if (!secret || !url) {
      console.error("Password reset: required server-side credentials are missing");
      return anonymousResponse(origin);
    }

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode("boudie-password-reset-quota-v1:" + secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const [emailHash, ipHash] = await Promise.all([
      identityHash(key, "email", email),
      identityHash(key, "ip", clientIp(request)),
    ]);

    const admin = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: allowed, error: quotaError } = await admin.rpc("be_claim_password_reset_slot", {
      p_email_hash: emailHash,
      p_ip_hash: ipHash,
    });

    if (quotaError) {
      console.error("Password reset quota error", quotaError.code || "unknown");
      return anonymousResponse(origin);
    }
    if (allowed !== true) {
      return anonymousResponse(origin);
    }

    // Redirect target is chosen by the server, never supplied by the caller.
    const redirectTo = body?.locale === "ar"
      ? "https://boudieeats.com/ar/account/?mode=reset"
      : "https://boudieeats.com/account/?mode=reset";
    const { error: resetError } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (resetError) {
      // Never return Supabase's email/account-specific error to callers.
      console.warn("Password reset dispatch error", resetError.code || resetError.status || "unknown");
    }
  } catch {
    console.error("Password reset request could not be processed");
  }
  return anonymousResponse(origin);
});
