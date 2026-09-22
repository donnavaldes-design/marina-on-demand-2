# Marina On Demand 3.1.1 — Preloaded Connections

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository:
- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
3.1.1-preloaded-connections

Customer-facing connection endpoints are now preloaded server-side:
- BMOD Tools / HighLevel: https://services.leadconnectorhq.com/mcp/openai/v2/
- Meta Ads: https://mcp.facebook.com/ads
- Canva: https://mcp.canva.com/mcp
- Google Drive: https://drivemcp.googleapis.com/mcp/v1
- Gmail: https://gmailmcp.googleapis.com/mcp/v1
- Google Calendar: https://calendarmcp.googleapis.com/mcp/v1

UX changes:
- Customers no longer paste MCP URLs.
- Button language is Connect Account, not Connect MCP.
- Known integrations use their catalog endpoint automatically.
- Connection state becomes Sign-In Required until OAuth is completed.
- Do not mark a provider Connected merely because the endpoint is known.
- Read-only discovery remains the safety default.

Next wiring step:
Implement provider OAuth sign-in/callback/token refresh. OpenAI Responses API requires the app to provide the user's OAuth access token with authenticated MCP requests.

Everything from 3.1.0 remains included.
