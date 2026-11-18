# Boudie Eats — Tally → Supabase → beehiiv integration (staged)

**State:** Code prepared on a separate integration branch. **Not deployed or live.**
**Target Supabase project:** `vktegxiycqwqnnqpxiuh` (Boudie Eats only).
**Target beehiiv publication:** `pub_b2a14ecd-641e-4357-b968-393e3097d525`.
**Do not run any of this in Without Permission's Supabase project.**

## Existing Tally forms

| Form ID | Purpose | Language |
| --- | --- | --- |
| `7XK9Dz` | Newsletter launch waitlist | Arabic |
| `vXDORl` | Newsletter launch waitlist | English |
| `aO4rxy` | Reader suggestions | Arabic |
| `kbG7Lo` | Reader suggestions | English |

The waitlist forms currently request permission to **contact the respondent at launch**.
They do **not** contain permission to subscribe them to an ongoing newsletter.
Existing waitlist responses must never be auto-imported as active beehiiv subscribers.

## Deployment requirements

1. Connect the Boudie Eats Supabase project to the authorized ChatGPT Supabase connector.
   The current connector can see only Without Permission and returns **permission denied** for Boudie Eats.
   Do not create a replacement project or re-run `boudieeats_independent_accounts_initial`.
2. Run **only** `schema.sql` in Boudie Eats Supabase SQL editor. This creates the new,
   RLS-enabled, private `be_tally_submissions` table; existing account tables remain unchanged.
3. Set **Supabase Edge Function secrets** (in Supabase, not in GitHub):
   - `BE_TALLY_SIGNING_SECRET` — long random signing secret, identical in all four Tally webhook configurations
   - `BE_BEEHIIV_API_KEY` — beehiiv API key for the **Boudie Eats** workspace, with subscription write access
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — environment values provided to Edge Functions; never expose to website/public JS
4. Deploy `index.ts` as a Supabase Edge Function named `be-tally-webhook`, with
   `verify_jwt = false`. The endpoint is publicly reachable, **but accepts only signed
   Tally requests**. This is necessary because Tally doesn't send Supabase JWTs.
   Example endpoint: `https://vktegxiycqwqnnqpxiuh.supabase.co/functions/v1/be-tally-webhook`.
5. In **each published Tally form**, open `Integrations → Webhooks → Connect`.
   Enter the endpoint above and set the **same signing secret** configured in Supabase.
   This action is not supported by the currently connected Tally tools, so must be done
   through the Tally UI or another authorized integration API.
6. Test a new Arabic waitlist submission, an English waitlist submission,
   and a reader-feedback submission. Verify rows in `be_tally_submissions`.
   Verify `newsletter_sync_status = 'not_authorized'` for existing waitlist consent.
   Test a repeated webhook delivery and confirm no duplicate record.
7. **Optional future newsletter signup:** once the backend is verified, add a separate,
   optional explicit consent checkbox to each newsletter form using exactly these labels:
   - English: `I agree to subscribe to the recurring Boudie Eats newsletter`
   - Arabic: `أوافق على الاشتراك في نشرة بودي إيتس البريدية الدورية`

   Republish the forms and ensure the newsletter description and privacy statement
   correctly explain recurring email, the sender, and how to unsubscribe.
   Only this separate consent triggers the beehiiv API. API calls request
   double opt-in and do not reactivate unsubscribed readers.

## Data handling and security

- All four forms have signing-secret verification and a strict form-ID allowlist.
- Database writes use only the server-held Supabase service key. RLS is enabled and
  public/authenticated database roles are denied access to `be_tally_submissions`.
- Form submissions are deduplicated on `(form_id, submission_id)`.
- Never commit the beehiiv API key, Tally signing secret, or Supabase service-role key.
- Feedback emails are **not** treated as newsletter subscribers.
- Old waitlist responses are **not** migrated to ongoing subscriptions.
- Tally may retry failed deliveries, so keep idempotency and monitor webhook logs.
- The webhook stores the form's answers; set appropriate data retention and privacy notices.
- A successful HTTP response confirms backend receipt, **not** that a user is subscribed.

## External references

- Tally webhooks/signature: https://tally.so/help/webhooks
- Supabase webhook function authorization: https://supabase.com/docs/guides/functions/auth
- beehiiv create subscription: https://developers.beehiiv.com/api-reference/subscriptions/create

**Pending before live status:** Supabase Boudie account authorization; function deployment;
Tally webhook configuration; beehiiv API secret; signed delivery and inbox opt-in verification.
