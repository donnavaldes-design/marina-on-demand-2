# Marina Canva connector

Implemented on production commit 8248e60, preserving its updated voice and Chat/Action Mode UI and retaining the verified BMOD connection implementation from 7bf2cbb. Uses the registered Canva developer app through native REST OAuth with S256 PKCE and Basic client authentication. No MCP dynamic registration. Canva's ChatGPT connector credentials are separate and cannot configure Marina.

## Required manual setup

1. Open the existing Marina On Demand app in the Canva Developer Portal. Outside Canva configuration must provide a client ID and client secret for REST OAuth. Confirm this is the intended app; the shared browser was signed out, so its identity/settings could not be audited.
2. Register exactly:
   `https://marina-on-demand-2-prototype.vercel.app/api/connections/canva/callback`
3. Select these supported read scopes:
   - `asset:read`
   - `brandtemplate:content:read`
   - `brandtemplate:meta:read`
   - `design:meta:read`
   - `folder:read`
4. Also select `design:content:write` for approved new-design creation. Marina requests it only in View + Take Action mode.
5. Add `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET` to Vercel Production, server-side only, then redeploy. Neither variable was visible in the inspected environment-variable list. Never paste the secret into chat or frontend code.
6. Ensure the test account can authorize the app during development. Complete Canva's applicable app review/distribution requirements before opening authorization to all customers. Brand-template access depends on the customer's Canva plan.

## Supported operations

| Operation | Native request | Permission |
| --- | --- | --- |
| list_designs | GET /designs | design:meta:read |
| get_design | GET /designs/:designId | design:meta:read |
| get_asset | GET /assets/:assetId | asset:read |
| list_folder_items | GET /folders/:folderId/items | folder:read |
| list_brand_templates | GET /brand-templates | brandtemplate:meta:read |
| get_brand_template | GET /brand-templates/:templateId | brandtemplate:meta:read |
| get_template_dataset | GET /brand-templates/:templateId/dataset | brandtemplate:content:read |
| prepare_design | Validate and prepare POST /designs | design:content:write |

Create supports title, custom width/height, and optionally an existing Canva image asset. It creates a blank/custom-size design or places that image, not a complete AI-designed layout. Prepare outside Action Mode does not write. Prepare inside Action Mode creates a server-owned proposal; the existing Approve/Reject buttons control execution. Approval creates once, reads back the design, and displays a Canva edit link. On ambiguous network failures, the approval is never automatically retried, avoiding duplicate designs. A new proposal is needed after reconnect or mode changes.

## Boundaries

- No public brand-kit listing endpoint/scope was found in the reviewed REST reference. Canva's assistant/MCP brand-kit tools are a different interface.
- Brand templates are supported; the public Canva template catalog is not exposed here.
- No prompt-to-design generation REST endpoint was verified. Autonomous generative layout is not claimed.
- Autofill generation is documented but not implemented in this release; production autofill requires Canva Enterprise (paid plans have a development trial).
- Preview design-copy/page endpoints are intentionally excluded from this public connector.
- No exports, publishing, deletion, folder changes, uploads, or existing-design mutations are implemented.

## Security and persistence

Access and refresh tokens are written atomically to Supabase Vault. A database lease serializes refresh and callback updates. The rotated pair is retried on storage errors without another exchange. State is consumed once and expires in ten minutes. No client secret is stored in browser state or OAuth state rows. Missing response scopes are introspected; unknown scopes remain ungranted. Omitted refresh scopes preserve previous grants. Missing scopes and temporary provider failures do not disconnect. Only explicit disconnect or confirmed invalid_grant requires reconnect.

Disconnect fences in-flight saves, clears locally stored credentials, and invalidates outstanding OAuth states. This removes Marina's access locally; users can additionally revoke the app in Canva account settings. Old approval proposals are bound to the connection's authorization timestamp. The approval payload table is service-role only, with RLS and no customer grants; an RLS-no-policy informational advisor finding is intentional for this private-by-privilege table. See https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy.

## Verification status

All 59 automated tests pass. Automated tests cover fixed-client OAuth, callback replay/cancellation/expiry, read and refresh cycles, scope denial, rotated pair retries, approval gating, duplicate approval, read-back verification, disconnect and reconnect. BMOD regressions are included. Production SQL rollback tests confirmed atomic Vault storage and disconnect fencing; fake test credentials were rolled back.

The live connect/read/reload/create/disconnect/reconnect cycle is NOT verified. No Canva credentials were configured in Vercel and the developer portal browser was signed out. Once configured, connect in View Only, verify reads, reload and verify again; enable View + Take Action, Update Permissions, request a test custom-size design in Action Mode, approve it, open its verified Canva link, then disconnect and reconnect. Do not delete customer designs as part of this test.

## Official sources

- https://www.canva.dev/docs/apps/rest-apis/authentication/
- https://www.canva.dev/docs/apps/rest-apis/scopes/
- https://www.canva.dev/docs/apps/rest-apis/reference/designs/create-design/
- https://www.canva.dev/docs/apps/rest-apis/reference/designs/list-designs/
- https://www.canva.dev/docs/apps/rest-apis/reference/brand-templates/list-brand-templates/
- https://www.canva.dev/docs/apps/rest-apis/reference/brand-templates/get-brand-template-dataset/
- https://www.canva.dev/docs/apps/rest-apis/reference/autofills/create-design-autofill-job/
