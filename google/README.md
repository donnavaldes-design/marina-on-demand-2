# Native Google connections

Gmail, Google Calendar and Google Drive use fixed GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET server credentials and the shared callback:
https://marina-on-demand-2-prototype.vercel.app/api/connections/oauth/callback

Enable Gmail API, Google Calendar API, and Google Drive API in the same Google Cloud project. Configure External consent and add test users while Testing.

Scopes are canonical in manifest.js: gmail.readonly, calendar.calendarlist.readonly, calendar.events.readonly, drive.readonly, each prefixed https://www.googleapis.com/auth/. Each card requests only its own scopes. No write scopes are requested. View Only is default; View + Take Action preserves the existing permission architecture but enables no Google writes in this release.

Operations: list_messages, get_message (plain text body, selected headers, no attachments), list_calendars, list_events, get_event, list_files, get_file. Drive currently returns metadata only, not file contents, download or export. All requests are GET except the OAuth token exchange. Parameters are validated, hosts fixed, missing scopes return an upgrade without disconnecting.

Tokens use atomic Supabase Vault transitions under a service-only database lease. Refresh responses without a refresh token retain the previous token. Returned rotated tokens replace it. Scope omission on refresh preserves the prior grant; callback scope omission never invents a grant. Only confirmed invalid_grant marks reauthorization required. Disconnect clears that card's locally stored credentials and pending OAuth states; it deliberately does not revoke Google's shared app grant, which could invalidate the other Google cards. Users can revoke the entire app in their Google account settings.

Google External apps in Testing issue refresh tokens that expire after seven days for these scopes. Production verification, and potentially a restricted-scope security assessment, is a separate launch prerequisite. That provider expiration cannot be bypassed with access-token refresh.

Verification: each card has Verify reads + refresh. It runs list reads before/after a real refresh and returns statuses only. Reload and repeat to check persistence. Automated tests use mock Google responses; live user consent and live Google data checks are still required.

Implementation sources:
https://developers.google.com/identity/protocols/oauth2/web-server
https://developers.google.com/identity/protocols/oauth2
https://developers.google.com/workspace/gmail/api/auth/scopes
https://developers.google.com/workspace/calendar/api/auth
https://developers.google.com/workspace/drive/api/guides/api-specific-auth
