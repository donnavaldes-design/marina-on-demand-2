# Corporate membership connection

Membership checks use the dedicated `bmod_membership` connection under the administrator specified by `runtime_settings.membership_access.connection_user_id`. The expected corporate location remains `membership_access.location_id`; OAuth callbacks reject any other location before saving tokens.

Setup: My MOD Settings > MOD Control Room > Corporate membership connection > Connect corporate BMOD account. Select the corporate account, then Test membership connection. This requires one fresh authorization; existing personal credentials are not copied.

The personal `bmod_tools` connection remains available for the user's business. Customer connection endpoints reject the internal key, connection lists exclude it, and a restrictive RLS policy hides its row from authenticated clients. Its Vault secrets and refresh lease are independent. Only service_role can invoke the corporate token lifecycle RPC. Corporate OAuth requests contacts.readonly. No corporate tools are exposed to the chat model.

Membership eligibility still uses exact email matching and live active/inactive tags. Lookup failure denies access with a temporary availability message. No stale entitlement fallback or new user exceptions were added.

Validation: membership-isolation, subscription-access and bmod-registry tests cover isolation, refresh routing, wrong-location rejection, and eligibility. Live authorization and end-to-end member login require the administrator to complete the corporate OAuth flow after deployment.
