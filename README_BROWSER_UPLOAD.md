# Marina On Demand 2.1.1 — Rich Formatting

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.1.1-rich-formatting

Includes everything from 2.1.0 attachments, plus:
- Proper Markdown rendering
- Bold emphasis
- Headings
- Bullets and numbered lists
- Tables
- Blockquotes
- Code formatting
- Clickable links
- Occasional natural emojis allowed in Marina's output
- Sanitized assistant HTML with DOMPurify

User messages remain plain/safe text.
Assistant Markdown is sanitized before rendering.

After Vercel says Ready, verify the top-right label shows:
2.1.1-rich-formatting

Then open an existing conversation with Markdown. It should render correctly without needing to rerun the prompt.
