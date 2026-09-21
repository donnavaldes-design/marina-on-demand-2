# Marina On Demand 2.7.0 — Marina Workspace

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.7.0-workspace

New customer workspace:
- My Brand
- My Offer
- My Content
- My Leads
- My Campaigns
- My Goals
- My Assets

Key behavior:
- Every Marina assistant response now has “Save to Workspace”
- User chooses the destination section and can rename the asset
- Saved assets persist independently from conversation history
- Saved items can be pinned, opened, worked on with Marina, or deleted
- Workspace items are private to the authenticated user
- Marina receives recent/pinned workspace context when answering, so saved business assets can inform future conversations
- “Build with Marina” starts a section-specific creation workflow

Control Room remains owner-only via:
CONTROL_ROOM_ADMIN_EMAIL

All prior features preserved:
- branded/mobile interface
- live brain + Control Room
- cross-conversation customer memory
- Coach Me / Create With Me / Action Mode Beta
- attachments
- feedback loop
- multi-source GHL entitlements
