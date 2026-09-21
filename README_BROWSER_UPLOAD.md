# Marina On Demand 2.0 — Flat Browser Upload v2

This build has NO folders.

Upload these four files directly to the ROOT of the GitHub repository and allow GitHub to replace the existing files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

This version adds:
- server-side Supabase service-role persistence
- explicit verification that both user and assistant messages were saved
- safe JSON serialization of OpenAI usage data
- build marker: 2.0.1-flat

After Vercel redeploys, the top-right app label should include:
2.0.1-flat

Then rerun one canary:
Who is Marina Simone?
