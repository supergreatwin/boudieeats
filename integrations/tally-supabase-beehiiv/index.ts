// Boudie Eats Tally -> Supabase -> beehiiv webhook.
// Deploy ONLY on the Boudie Eats Supabase project (vktegxiycqwqnnqpxiuh).
// No imports; built-in Deno Fetch + Web Crypto.
// Set verify_jwt = false; request authenticity is enforced with Tally's HMAC.
const FORM_MAP: Record<string, { kind: "waitlist" | "feedback"; language: "ar" | "en" }> = {
  "7XK9Dz": { kind: "waitlist", language: "ar" },
  "vXDORl": { kind: "waitlist", language: "en" },
  "aO4rxy": { kind: "feedback", language: "ar" },
  "kbG7Lo": { kind: "feedback", language: "en" },
};
const PUBLICATION_ID = "pub_b2a14ecd-641e-4357-b968-393e3097d525";

// Exact labels deliberately DIFFER from the existing launch-only checkbox.
// No current Boudie Eats form contains either of these labels: therefore
// existing waitlist responses NEVER generate newsletter subscriptions.
// Add an optional explicit recurring-newsletter checkbox in each signup form
// after the backend is deployed/tested, then republish those forms.
const NEWSLETTER_OPTIN_LABELS = new Set([
  "I agree to subscribe to the recurring Boudie Eats newsletter",
  "أوافق على الاشتراك في نشرة بودي إيتس البريدية الدورية",
]);
const LAUNCH_OPTIN_LABELS = new Set([
  "I consent to BoudieEats storing my email to contact me about the newsletter launch",
  "أوافق على الاحتفاظ ببريدي الإلكتروني للتواصل معي عند إطلاق النشرة",
]);

type TallyField = { label?: string; type?: string; value?: unknown };
type TallyPayload = {
  eventId?: string;
  eventType?: string;
  data?: {
    formId?: string;
    responseId?: string;
    submissionId?: string;
    createdAt?: string;
    fields?: TallyField[];
  };
};

const enc = new TextEncoder();

function eqFixedTime(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

function base64ToBytes(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function verifyTally(body: TallyPayload, signature: string, secret: string): Promise<boolean> {
  const received = base64ToBytes(signature.trim());
  if (!received) return false;
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  // Tally documents HMAC-SHA256 over JSON.stringify(parsedPayload), base64.
  const hmac = new Uint8Array(await crypto.subtle.sign(
    "HMAC", key, enc.encode(JSON.stringify(body)),
  ));
  return eqFixedTime(hmac, received);
}

function hasConsent(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return !!v && !["false", "no", "off", "0", "لا"].includes(v);
  }
  return value === 1;
}

function getStringField(fields: TallyField[], names: string[]): string | null {
  const found = fields.find((f) => names.includes(f.label ?? ""));
  return typeof found?.value === "string" ? found.value.trim() : null;
}

function consentByLabel(fields: TallyField[], labels: Set<string>): boolean {
  return fields.some((f) => labels.has(f.label ?? "") && hasConsent(f.value));
}

async function rest(path: string, method: string, key: string, apiUrl: string, body: unknown) {
  return fetch(`${apiUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("BE_TALLY_SIGNING_SECRET");
  const projectUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !projectUrl || !serviceKey) {
    return new Response("Server configuration incomplete", { status: 503 });
  }

  const signature = request.headers.get("Tally-Signature") ?? "";
  const raw = await request.text();
  if (raw.length > 512_000) return new Response("Too large", { status: 413 });

  let event: TallyPayload;
  try {
    event = JSON.parse(raw) as TallyPayload;
  } catch {
    return new Response("Malformed JSON", { status: 400 });
  }
  if (!(await verifyTally(event, signature, secret))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const d = event.data;
  const form = d?.formId ? FORM_MAP[d.formId] : undefined;
  const submissionId = d?.submissionId ?? d?.responseId;
  if (event.eventType !== "FORM_RESPONSE" || !d?.formId || !form || !submissionId) {
    return new Response("Unsupported form/event", { status: 422 });
  }
  const fields = Array.isArray(d.fields) ? d.fields : [];
  const email = getStringField(fields, ["Email address", "بريدك الإلكتروني", "Contact email (optional)", "بريد إلكتروني للتواصل (اختياري)"])
    ?? (typeof fields.find((f) => f.type === "INPUT_EMAIL")?.value === "string"
      ? String(fields.find((f) => f.type === "INPUT_EMAIL")?.value).trim() : null);
  const firstName = getStringField(fields, ["First name (optional)", "اسمك الأول (اختياري)"]);
  const launchConsent = form.kind === "waitlist" && consentByLabel(fields, LAUNCH_OPTIN_LABELS);
  const newsletterConsent = form.kind === "waitlist" && consentByLabel(fields, NEWSLETTER_OPTIN_LABELS);
  const record = {
    event_id: event.eventId ?? null,
    form_id: d.formId,
    submission_id: submissionId,
    kind: form.kind,
    language: form.language,
    email,
    first_name: firstName,
    launch_contact_consent: launchConsent,
    recurring_newsletter_consent: newsletterConsent,
    newsletter_sync_status: newsletterConsent ? "pending" : "not_authorized",
    fields,
    submitted_at: d.createdAt ?? null,
  };

  const save = await rest(
    "be_tally_submissions?on_conflict=form_id%2Csubmission_id",
    "POST", serviceKey, projectUrl, record,
  );
  if (!save.ok) {
    console.error("Tally database write failed:", save.status);
    return new Response("Database unavailable", { status: 502 });
  }

  // Existing four forms have no recurring-newsletter checkbox. Do not
  // silently convert launch-only waitlist consent into an active subscription.
  if (!newsletterConsent) {
    return Response.json({ received: true, stored: true, newsletter: "not_authorized" });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("Newsletter consent needs a valid email", { status: 422 });
  }

  const beehiivToken = Deno.env.get("BE_BEEHIIV_API_KEY");
  if (!beehiivToken) return new Response("beehiiv secret not configured", { status: 503 });
  const beehiiv = await fetch(
    `https://api.beehiiv.com/v2/publications/${PUBLICATION_ID}/subscriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${beehiivToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: false,
        double_opt_override: "on",
        utm_source: "tally",
        utm_medium: "newsletter",
        utm_campaign: `boudieeats_${form.language}`,
      }),
    },
  );
  if (!beehiiv.ok) {
    console.error("beehiiv subscribe failed:", beehiiv.status);
    return new Response("Newsletter sync unavailable", { status: 502 });
  }

  const update = await fetch(
    `${projectUrl.replace(/\/$/, "")}/rest/v1/be_tally_submissions?form_id=eq.${encodeURIComponent(d.formId)}&submission_id=eq.${encodeURIComponent(submissionId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newsletter_sync_status: "synced", synced_at: new Date().toISOString() }),
    },
  );
  if (!update.ok) {
    console.error("Newsletter status update failed:", update.status);
    return new Response("Newsletter status update failed", { status: 502 });
  }
  return Response.json({ received: true, stored: true, newsletter: "double_opt_in_requested" });
});
