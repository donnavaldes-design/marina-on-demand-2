# Marina On Demand 2.1 — Attachments Build

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.1.0-attachments

New capability:
- Paperclip/plus attachment button
- Images and screenshots
- PDFs
- TXT/Markdown/JSON/CSV
- DOC/DOCX
- XLS/XLSX
- PPT/PPTX
- Up to 5 files per message
- 20 MB max per file
- Private Supabase Storage
- Attachments persist with conversation messages
- Short-lived signed URLs are supplied to OpenAI only when analysis is required

After Vercel says Ready, verify the top-right label shows:
2.1.0-attachments

Recommended first test:
Upload a screenshot and ask, "Audit this like Marina. What is working, what is weak, and what would you change first?"
