# Marina On Demand 2.8.0 — Real Action Engine

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.8.0-action-engine

Action Mode is now an actual controlled execution engine.

What Marina can execute internally:
- Create finished business assets
- Save them automatically into the correct Marina Workspace section
- Build campaigns, content, offers, DM flows, goals and reusable assets
- Create concrete user tasks only when the human must do something
- Track every Action Run and its steps

External side effects:
- External actions are NEVER silently executed
- Marina can queue proposed actions for systems like HighLevel, Gmail, Canva, Meta, etc.
- User can Approve or Reject each proposed action
- Approved actions remain clearly marked as waiting for a connected executor
- No email, post, CRM edit, automation change, scheduling action, purchase, or other external side effect is claimed unless a future connected executor actually performs it

This build is the foundation for:
- HighLevel execution tools
- Email tools
- Canva creation
- publishing/scheduling
- future Agents API migration for long-running work

All previous features are preserved:
- Marina Workspace
- Owner-only Control Room
- Live Brain
- customer memory
- branded/mobile UI
- attachments
- feedback
- multi-source GHL entitlements
