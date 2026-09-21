# Marina On Demand 2.2.1 — Benchmark UI Fix

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.2.1-benchmark-ui

Fix:
The 2.2.0 backend benchmark API deployed correctly, but the sidebar button and browser runner were missing from index.html.

This version visibly adds:
Run 30-prompt migration benchmark

The runner:
- creates one run ID
- runs all 30 prompts sequentially
- each prompt uses fresh context
- saves results into Supabase benchmark_results
- shows progress and pass/fail request status in the browser

After Vercel says Ready:
1. Confirm the top-right says 2.2.1-benchmark-ui
2. Click Run 30-prompt migration benchmark
3. Leave the tab open
4. When it says Complete, tell ChatGPT: benchmark complete
