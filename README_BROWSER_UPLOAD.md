# Marina On Demand 3.4.0 — BMOD Native HighLevel API

Upload all four flat files to the repository root.

Build marker:
3.4.0-bmod-native-api

Major change:
BMOD Tools no longer uses HighLevel's MCP server after OAuth.

Why:
The HighLevel Marketplace OAuth token successfully exchanged, but HighLevel MCP tool discovery returned HTTP 424. Marina now uses the native HighLevel API directly with the same OAuth token.

Connection verification:
- OAuth token exchange
- capture HighLevel locationId
- verify token by listing pipelines with native HighLevel API
- mark BMOD Tools Connected only after verification succeeds

Live read tools now available to Marina:
- Search contacts
- Search opportunities
- List pipelines
- List workflows

These can be used in Coach Me, Create With Me, and Action Mode.

Current safety:
- BMOD native tools are READ-ONLY.
- Writes still queue through Action Mode rather than executing.
- Token refresh is supported using the stored HighLevel refresh token.

This removes HighLevel MCP as a dependency for BMOD Tools.
Other integrations may continue using MCP.
