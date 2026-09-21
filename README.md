# Marina On Demand 2.0, private prototype

A Vercel-ready Next.js 16 app using Supabase Auth/Postgres and OpenAI Responses API.

## What this prototype proves
- Marina personality is owned in application code, not trapped in a Custom GPT.
- Named Marina frameworks use deterministic canonical routing.
- OpenAI conversation state is separate from durable customer business memory.
- Supabase stores login, conversations, messages, entitlements, customer business memory, dynamic business data, and GHL sync events.
- GHL remains the future commercial source of truth for monthly, annual, and BMOD-included access.

## 1. Supabase
Run `supabase/migrations/001_marina_on_demand.sql` in the SQL editor.

In Auth settings:
- enable email OTP / magic links
- add your Vercel preview/production URL to redirect URLs
- for the private test, use only Donna and Marina email addresses

## 2. Vercel environment variables
Copy `.env.example` fields into Vercel.

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

Prototype settings:
- `OPENAI_MODEL=gpt-5.6-terra`
- `PROTOTYPE_ALLOW_ALL_AUTHENTICATED=true`
- `ALLOWED_TEST_EMAILS=donna@example.com,marina@example.com`

Do not expose `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `GHL_WEBHOOK_SECRET` as public variables.

## 3. Deploy
Deploy to Vercel. Start with the Vercel-generated domain. Do not move `marinaondemand.com` or change customer routing yet.

## 4. Benchmark gate
Run the existing 30-prompt benchmark against this prototype.
Critical canaries:
- 333 Method must say 3 meaningful comments, 3 likes, 3 non-salesy messages.
- Confidence Stacking must use one daily non-negotiable, track, repeat, then increase difficulty.
- Who is Marina Simone must use the approved canonical brand bio.

## 5. GHL integration comes after the AI passes
Verified BMOD location: `BSqDPpmVR6JOJoIcHbh9`.
Known inactive signals include `mod inactive`, `bmod terminated`, and an existing Marina status field set to `inactive`.
Do not activate `/api/webhooks/ghl` until the active-state workflow is fully mapped and tested.

## Architecture decision
For the private prototype, canonical framework retrieval is deterministic in `lib/marina/knowledge.ts`. This is intentional. OpenAI File Search can be added for the larger supporting knowledge corpus after benchmark fidelity is proven.


## Deployment note
The live Supabase schema has already been created. Do not re-run the reference migration unless you are provisioning a new database.
