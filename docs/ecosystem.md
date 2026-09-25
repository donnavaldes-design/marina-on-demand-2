# My Ecosystem, beta v1

Income sources and the priority ID are persisted within the existing user-owned customer_memory.brand_brain.ecosystem JSON. Each source has its own offers, audience, goals, marketing/follow-up notes, and network marketing details. Shared brand fields remain intact. Server-side normalization limits source count and field lengths and rejects invalid/duplicate keys.

Remote migration `ecosystem_conversation_context` was applied on 2026-09-25:

```sql
alter table public.conversations add column if not exists ecosystem_business_id text;
comment on column public.conversations.ecosystem_business_id is 'User-owned income source key in customer_memory.brand_brain.ecosystem.businesses; null means whole ecosystem.';
```

Existing conversation RLS remains unchanged. API updates are filtered by authenticated user ID. Business IDs are resolved only against that user's saved ecosystem. New asset metadata inherits the owning conversation's business context. Existing unclassified work is retained as shared/legacy context.

Automatic updates to the old single-business memory are disabled for users with income sources, preventing one business's conversation from overwriting another's offer or goal. Updates to ecosystem facts are made through the saved form or the update_my_ecosystem chat tool when the user asks to fill or update those fields. This tool merges only allowed fields and upserts businesses while preserving unrelated businesses and private reference notes. It requires a database result before reporting success. Saved Work documents remain separate from form updates. Home uses the priority goal but activity metrics remain explicitly ecosystem-wide.

Reference uploads start a business-specific chat for review. The original attachment persists in that chat. Approved extracted takeaways can be saved manually to the income source's Reference notes; automatic reference ingestion and ongoing performance analytics are not part of this version.
