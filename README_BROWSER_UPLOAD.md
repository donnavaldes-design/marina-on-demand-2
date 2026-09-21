# Marina On Demand 2.0 — Browser Upload Build

This version is intentionally flat so it can be uploaded to GitHub entirely in the browser.

Upload these root-level files to the repository:
- index.html
- api.js
- vercel.json
- README_BROWSER_UPLOAD.md

Then connect that GitHub repository to the existing Vercel project.

The Vercel project must already contain:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- OPENAI_MODEL
- PROTOTYPE_ALLOW_ALL_AUTHENTICATED
- BMOD_LOCATION_ID

After the first Vercel deployment:
1. Copy the *.vercel.app URL.
2. In Supabase Authentication URL Configuration, set Site URL to that deployment URL.
3. Add the same URL to Redirect URLs.
4. Test magic-link login.
