# Marina On Demand connection audit

Status as of 2026-09-22 15:11 UTC: database migration applied and verified; application fix deployed to production in commit f364b6908872d76a534e96b81fdf536b054eeca2, deployment dpl_2dg5Qux8YMYH2yA74182j8JcYWYU, READY. Live end-to-end verification is pending authenticated app access. Runtime logs remain blocked by a 403.

## Production evidence

- Vercel project: marina-on-demand-2-prototype. Production deployment dpl_CWPdkwNU7sYbpqK8Eo9tA9gLUc2V, READY, commit 77b6af8944c1c8f1c755224d1d22a17633391792.
- Supabase project: Marina On Demand, niavtbuihiaxouohrktl.
- BMOD authorization completed September 22 at 14:31:56 UTC. Last check was 14:32:09 UTC. Status subsequently became auth_required at 14:34:04 UTC, followed by a pending OAuth state at 14:34:05 UTC.
- Access-token expiry is September 23 at 14:31:54 UTC. This token was not expired when the false-disconnected record was inspected.
- Both access-token and refresh-token Vault records exist. Their last updates were September 22 at 14:31:55 UTC. No secret values were displayed.
- oauth_provider is null and oauth_token_auth_method is none despite HighLevel OAuth being in use.
- Vercel UI confirms production HIGHLEVEL_CLIENT_ID, HIGHLEVEL_CLIENT_SECRET, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and NEXT_PUBLIC_SITE_URL variables exist. Secret values were not revealed or changed. Callback records use the production app origin.
- Runtime-log API returned 403, so runtime errors could not be inspected. This is an access failure, not evidence that logs are empty.

## Confirmed code defects

1. BMOD Test connection falls into generic OpenAI MCP discovery, although BMOD uses the native HighLevel API. That path can write error/configured status and replace tool metadata.
2. Both the configure POST and OAuth start POST overwrite the existing status with auth_required. Abandoning a new sign-in therefore loses a previously connected status. The production timestamps match a new OAuth start at the time of the observed state change. Without runtime logs, the exact preceding UI actions remain unconfirmed.
3. Refresh already replaces a returned refresh token, but access token, refresh token, and expiry are written in separate operations. There is no concurrency guard across Vercel instances.
4. Native API calls do not refresh/retry on HTTP 401. Token expiry refresh exists, but only after the status-gated read path makes the integration available.
5. Callback verification can convert a successfully authorized connection into an error on a temporary pipeline API failure. Callback state is consumed too late to prevent duplicate exchanges.
6. The UI displays stored status; it does not itself compute token expiry or directly label an expired token disconnected.

## Changes

Applied to production Supabase:

- Migration 20260922145328_bmod_connection_reliability adds token leases and a service-only atomic transition RPC. Privileged logic is in bmod_internal; the public wrapper uses security invoker.
- The transaction saves both Vault secrets and expiry together, fences stale writes, and prevents an in-flight refresh from undoing an explicit disconnect.
- No stored customer authorization, token, or status was changed persistently by the validation tests.

Deployed in the application patch:

- Native HighLevel pipeline verification for BMOD Test connection.
- Idempotent connection setup and OAuth start, plus removal of the redundant UI configure request.
- Serialized refreshes, atomic rotated-token persistence, retries of the same token pair after transient storage failures, and one bounded refresh/retry after HTTP 401.
- Temporary API, configuration, or rate-limit failures do not revoke authorization. Explicit invalid_grant requires reconnect.
- Single-use callback state, persisted authorization before API verification, and no provider error payloads in callback redirects.
- Narrow recovery of legacy false-disconnected records, only after a successful native API read. Explicitly disabled records cannot recover automatically.
- Provider and token-auth metadata populated correctly. Existing product design and Marina AI instructions remain unchanged.

## Verification

- `node --test tests/connections.test.cjs`: 18/18 PASS using simulated external services.
- Covered cycle: OAuth callback -> pipeline read -> expired access token -> refresh and rotated-token save -> fresh connections request -> second pipeline read. This is an automated simulation, not the requested live browser cycle.
- Additional coverage: parallel refreshes, 401 retry bounds, 429/500/503, invalid_grant, invalid_client, storage retry, callback cancellation/replay, legacy recovery, and disconnect during refresh/read.
- Production database rollback tests: PASS for exclusive leases, owner fencing, atomic Vault pair plus expiry, invalid payload rejection, lease release, disconnect fencing, and RPC access controls. Also confirmed execution as the actual service_role. All fixture writes rolled back.
- Post-test check confirmed original access/refresh update timestamps and connection status were unchanged, with no lease left active.
- Security advisor returned no finding for the new schema/functions. Existing unrelated advisor notices were not modified.
- Syntax and diff whitespace checks passed.

## Remaining live work

1. Publishing completed through GitHub. Vercel confirmed production READY and the primary app alias points to the new deployment. Newer pre-existing Marina voice updates were preserved byte-for-byte.
2. Obtain runtime logs through Vercel access for the Donna team. Current log requests return 403.
3. Finish authenticated Marina browser access. The app offers email magic links; the browser remains signed out.
4. Run the actual connect/read/refresh/reload/read cycle, checking Vault update timestamps, expiry advancement, persistent status, and secret-free runtime logs. If forcing expiry, change only the authorized test connection and restore it if refresh does not complete.

Reference: HighLevel documents access tokens expiring after approximately 24 hours and refresh-token replacement on every refresh at https://marketplace.gohighlevel.com/docs/Authorization/OAuth2.0/index.html .

## Funnel permission follow-up

- Marketplace Auth settings show all five funnel-related scopes selected. The saved user authorization contains only the five original CRM scopes. Selecting Marketplace scopes alone did not upgrade the installed grant.
- Original native bmod_read implemented contacts, opportunities, pipelines and workflows only. No funnel endpoint was called.
- Added native funnel list/latest-created lookup, page metadata lookup and page count, with scope checks and account-location scoping. Latest-created lookup checks pagination completeness and creation dates before asserting a global result.
- OAuth requests now include the three funnel read scopes. Connections offers Enable funnel access while retaining the current connected status. Tool availability is calculated from saved scopes, including after refresh. No page-content/layout write operation is implemented.
- Automated suite: 24/24 passed, including funnel permission upgrade, expired-token funnel read, pagination, missing dates, and page scope checks. Real funnel lookup and live refresh cycle still require authenticated Marina access and the upgraded user grant.
