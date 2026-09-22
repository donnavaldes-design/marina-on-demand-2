# Marina On Demand 3.1.0 — Connections + MCP

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:
- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
3.1.0-connections-mcp

New customer-facing Connections area:
- BMOD Tools — HighLevel CRM + Automation
- Meta Ads
- Gmail (coming soon)
- Google Drive (coming soon)
- Canva (coming soon)

MCP support:
- Connect a trusted remote MCP server via HTTPS URL or OpenAI Secure MCP tunnel ID.
- Optional authorization token is stored in Supabase Vault.
- The token is never returned to the browser.
- Connection discovery reads the MCP server's tool list.
- Marina auto-approves only clearly read-only tool names such as get/list/search/read/fetch/find/view.
- Connected read-only MCP tools are injected into Marina's Responses API requests.
- Coach Me, Create With Me, Skills, and Action Mode can use connected read-only MCP data.
- No MCP write tools execute in this release.
- Write actions remain routed through Marina Action Mode approval.

Important:
An ordinary website URL or API endpoint is not automatically an MCP server. Use a remote MCP endpoint that supports Streamable HTTP or HTTP/SSE, or an OpenAI Secure MCP tunnel.

Everything from 3.0.1 remains included.
