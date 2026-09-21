# Marina On Demand 2.2.0 — Benchmark Runner

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.2.0-benchmark-runner

New migration capability:
- One-click 30-prompt benchmark runner
- Every benchmark prompt runs with fresh context
- No customer memory is injected
- Results are stored in Supabase benchmark_results
- Each result stores test ID, category, prompt, response, route, model and OpenAI response ID
- Designed for direct comparison against the Marina 1.0 benchmark sheet

Existing capabilities preserved:
- Compact rich formatting
- Persistent conversations
- Screenshot/image uploads
- PDF/document uploads
- Private Supabase attachment storage

After deployment:
1. Confirm top-right says 2.2.0-benchmark-runner
2. Click “Run 30-prompt migration benchmark”
3. Leave the browser tab open while it runs
4. When it says Complete, tell ChatGPT “benchmark complete”
