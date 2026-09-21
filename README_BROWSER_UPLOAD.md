# Marina On Demand 2.6.0 — Control Room + Live Brain

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.6.0-control-room

New:
- Marina Control Room for admin/test emails
- Live business data editing without redeploy
- Live voice and operating overrides without redeploy
- Canonical Google Drive brain sources synced into Supabase
- Runtime now reads live Marina OS plus route-specific canonical source docs
- Product/current questions receive live structured business data
- Control Room change audit log

Admin access:
- Uses CONTROL_ROOM_ADMIN_EMAILS if set
- Also treats existing ALLOWED_TEST_EMAILS as Control Room admins during private beta

Canonical source updates remain intentionally controlled. Tell ChatGPT the framework/method change so it can version, benchmark and publish safely rather than editing core methods casually in the UI.

Existing entitlement, memory, dashboard, Action Mode, attachments, feedback, branding and mobile behavior are preserved.
