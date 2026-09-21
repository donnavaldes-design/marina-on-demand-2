# Marina On Demand 2.3.0 — Customer Memory

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.3.0-customer-memory

New:
- Durable business memory across separate conversations
- Automatic extraction of stable, non-sensitive business context
- Memory fields:
  - business type
  - company / vehicle
  - primary offer
  - target audience
  - primary goal
  - current constraint
  - current framework
  - preferred platform
  - last assignment
  - assignment status
  - brand positioning
  - other useful business context
- Sidebar button: What Marina remembers
- Users can view, edit, or clear their business memory
- Conversation history and business memory are separate
- Memory changes are audit-logged
- Sensitive personal information is excluded by the extraction policy

Benchmark refinements included:
- Shorter default answers unless depth is requested
- Brief narrowing/assumption before bulk-content generation
- Less therapy-adjacent language in emotional-support responses

After deployment:
1. Confirm top-right says 2.3.0-customer-memory
2. Start a new conversation and tell Marina a few stable business facts, e.g.:
   "I sell a $97 content workshop to women in network marketing. Instagram is my main platform and my goal is 10 workshop sales this month."
3. Let Marina answer.
4. Click What Marina remembers.
5. Confirm the relevant business facts were saved.
6. Start another new conversation and ask:
   "What should I focus on today?"
7. Marina should naturally use relevant remembered context without making you repeat everything.
