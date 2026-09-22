# Marina On Demand 3.3.3 — HighLevel Token v3 Fix

Upload all four flat files to the existing repository root.

Build marker:
3.3.3-highlevel-token-v3

Fixes HighLevel 422 Unprocessable Entity during OAuth token exchange.

Changes:
- HighLevel token exchange now matches current documented v3 contract exactly.
- Adds required `Version: v3` request header.
- Sends form-urlencoded:
  client_id
  client_secret
  grant_type=authorization_code
  code
  user_type=Location
  redirect_uri
- Removes PKCE fields from the HighLevel authorization flow.
- Improves error detail returned from HighLevel if exchange still fails.

Required Vercel env vars:
HIGHLEVEL_CLIENT_ID
HIGHLEVEL_CLIENT_SECRET
NEXT_PUBLIC_SITE_URL

Everything from 3.3.2 remains included.
