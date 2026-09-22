# Marina On Demand 3.3.2 — HighLevel Scopes Fix

Upload all four flat files to the existing repository root.

Build marker:
3.3.2-highlevel-scopes

Fix:
HighLevel requires a non-empty OAuth `scope` parameter. The BMOD Tools adapter now sends scopes.

Default test scopes:
- locations.readonly
- contacts.readonly
- opportunities.readonly
- pipelines.readonly
- workflows.readonly

Optional Vercel environment variable:
HIGHLEVEL_SCOPES

If HIGHLEVEL_SCOPES is set, Marina uses that exact space-separated list instead of the default test scopes.

Existing required variables:
HIGHLEVEL_CLIENT_ID
HIGHLEVEL_CLIENT_SECRET
NEXT_PUBLIC_SITE_URL

This build keeps write execution disabled while we validate the connection. After OAuth works, expand HIGHLEVEL_SCOPES and wire Marina's View + Take Action toggle / approval bridge.
