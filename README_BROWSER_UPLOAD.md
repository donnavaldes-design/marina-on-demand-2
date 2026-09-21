# Marina On Demand 2.5.0 — Wow Dashboard

Flat browser-upload build. No folders.

Upload the same four ROOT files:
- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker: 2.5.0-wow-dashboard

Adds the demo/retention layer without changing entitlement enforcement:

- Business Dashboard on login
- Current offer, audience, goal, bottleneck, platform and last assignment
- Today's Move card
- Three product modes:
  - Coach Me
  - Create With Me
  - Action Mode ⚡ Beta
- Create With Me quick asset builders
- Action Mode execution-plan behavior
- Clear guardrail: Action Mode never claims external actions happened unless a connected tool actually performed them
- Strategy receipts on new Marina responses
- 👍 / 👎 answer feedback stored in Supabase for future tuning
- Benchmark button removed from customer-facing sidebar (benchmark API remains available)
- Model name hidden from customer-facing header

Important:
- Keep PROTOTYPE_ALLOW_ALL_AUTHENTICATED=true until the GHL grant/revoke tests are verified.
- This build does NOT turn on production access enforcement.
- Full external-app agent execution comes later; Action Mode is accurately labeled Beta and currently handles execution planning + assets inside Marina.
