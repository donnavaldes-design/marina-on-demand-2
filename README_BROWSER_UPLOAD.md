# Marina On Demand 3.2.0 — Secure MCP OAuth

Upload all four flat files to the existing repository root.

Build marker:
3.2.0-secure-oauth

Fixes the dead "Continue Secure Sign-In" buttons.

Flow:
1. Customer clicks Connect Account.
2. Marina uses the preloaded MCP URL.
3. Backend probes the MCP server for OAuth protected-resource metadata.
4. Backend discovers the authorization server.
5. When supported, Marina dynamically registers an OAuth client.
6. Browser opens the provider's real login/consent page using Authorization Code + PKCE.
7. Provider returns to /api/connections/oauth/callback.
8. Marina exchanges the code for access/refresh tokens.
9. Tokens are stored server-side using Supabase Vault.
10. Marina discovers the connected MCP tools and marks the account Connected.

Important:
- Providers that support standard MCP OAuth + Dynamic Client Registration can connect without customers knowing a URL, client ID, or secret.
- Providers that require the Marina On Demand application to be registered in their developer portal will now return a clear setup-required message instead of a dead button.
- BMOD Tools/HighLevel's execute_operation tool remains withheld in this build. Its catalog/search/describe tools may connect, but the actual execute bridge needs Marina's MCP approval layer before read/write operation execution is enabled.
- No connection is marked Connected until token exchange and MCP tool discovery succeed.
