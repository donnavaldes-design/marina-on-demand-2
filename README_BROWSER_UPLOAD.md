# Marina On Demand 3.3.1 — HighLevel OAuth Adapter

Upload all four flat files to the existing repository root.

Build marker:
3.3.1-highlevel-oauth

Fix:
BMOD Tools no longer uses generic MCP dynamic OAuth registration.

BMOD Tools now uses the registered HighLevel developer app:
- HIGHLEVEL_CLIENT_ID
- HIGHLEVEL_CLIENT_SECRET
- Authorization endpoint:
  https://marketplace.gohighlevel.com/oauth/chooselocation
- Token endpoint:
  https://services.leadconnectorhq.com/oauth/token
- user_type=Location
- callback:
  NEXT_PUBLIC_SITE_URL + /api/connections/oauth/callback

Required Vercel environment variables:
HIGHLEVEL_CLIENT_ID
HIGHLEVEL_CLIENT_SECRET
NEXT_PUBLIC_SITE_URL

Expected customer flow:
Connections → BMOD Tools → Continue Secure Sign-In
→ HighLevel location selection / authorization
→ callback to Marina
→ token stored securely
→ MCP tool discovery
→ Connected

Everything from 3.3.0 remains included.
