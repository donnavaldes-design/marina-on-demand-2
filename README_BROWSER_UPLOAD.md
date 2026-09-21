# Marina On Demand 2.4.0 — GHL Entitlement Receiver

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.4.0-ghl-entitlements

New:
- Secure POST /api/ghl-entitlement webhook endpoint
- Accepts entitlement events before or after a customer has ever logged into Marina
- Normalizes access source to:
  - monthly
  - annual
  - bmod
  - admin
- Stores email-level access state
- Syncs to the Supabase user entitlement automatically once that email has an account
- Records GHL events for audit/debugging
- Supports cancellation/termination by sending active=false

Webhook payload contract:
{
  "event_id": "unique-event-id",
  "event_type": "subscription_started",
  "email": "customer@example.com",
  "active": true,
  "source": "monthly",
  "plan_name": "Marina On Demand Monthly",
  "ghl_contact_id": "optional-contact-id",
  "renewal_or_expiry": "optional ISO timestamp",
  "secret": "same value as GHL_WEBHOOK_SECRET"
}

Security:
Set GHL_WEBHOOK_SECRET in Vercel. The endpoint accepts the secret in:
- x-marina-webhook-secret header
- Bearer Authorization header
- JSON body field "secret"

IMPORTANT:
Leave PROTOTYPE_ALLOW_ALL_AUTHENTICATED=true while testing.
Do not switch live access enforcement on until all current customer paths have been mapped and tested.

Next:
Connect exact GHL purchase/cancellation/BMOD workflows to this endpoint once the workflow signals are confirmed.
