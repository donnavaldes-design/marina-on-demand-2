# Marina On Demand 2.9.0 — Skill Engine

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.9.0-skill-engine

Claude-sourced Marina skills activated:
- Engineer the Demand
- Pinterest Pin Strategist
- Build My Newsletter System
- Secret Podcast Builder
- DM Conversation Auditor (internal Seven Layers quality-control skill)

Behavior:
- User-facing skills appear in Create With Me as branded skill cards.
- Skill definitions live in Supabase, not hard-coded into the global Marina prompt.
- Skills route into the same Marina brain, memory, Workspace and Action Engine.
- Action skills can build and save finished assets into Workspace.
- DM auditing can auto-route internally without teaching a separate Seven Layers lesson.
- Skill runs are tracked in Supabase for later analytics and tuning.
- Marina OS and canonical Method Library remain higher authority than skill-specific workflows.

All previous features preserved:
- Real Action Engine
- Marina Workspace
- Owner-only Control Room
- Live Brain
- customer memory
- branded/mobile UI
- attachments
- feedback
- multi-source GHL entitlements
