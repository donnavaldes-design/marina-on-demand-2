# Marina On Demand 2.1.3 — Spacing Fix

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.1.3-spacing-fix

Root cause fixed:
The old chat bubble used `white-space: pre-wrap`, which was correct for plain text but caused invisible whitespace around rendered Markdown block elements to become giant vertical gaps.

Fix:
- Assistant bubbles now use normal HTML whitespace
- User bubbles retain pre-wrap
- Markdown paragraphs/lists remain compact
- Existing bold/headings/tables/blockquotes/links/attachments are unchanged

No prompt rerun is needed. Existing stored replies will immediately re-render with corrected spacing after deployment.
