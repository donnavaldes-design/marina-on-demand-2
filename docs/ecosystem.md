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


Beta v2: business array order is the priority order, with the first business used for Home coaching. Categories support multiple selections; legacy type values remain compatible. Main offers are optional free/entry/core/premium levels with name, description, price, URL and goal. Sites are validated HTTP(S) URLs. Legacy free-form fields remain preserved under Earlier details. Empty optional offer levels do not count as unfinished setup.

Compensation and policy references are shown for network marketing and affiliate businesses. Uploaded originals stay in the existing private attachments bucket; reviewed summaries and file metadata are saved under the owning business only after review. A signed original-document URL is issued only after looking up the resource in the authenticated user's saved ecosystem. URL resources start unreviewed and can be reviewed in a business-specific chat; inaccessible links must not be represented as reviewed. Summaries, rather than entire original documents, are included in future coaching context.


Network marketing setup: network-only businesses use named replicated-site, funnel, shopping, opportunity and team-resource URL fields instead of an offer ladder. Mixed-category businesses retain their own optional offer path. Optional coaching facts include company start date in user words, experience level, current rank, active customers/personally enrolled partners (including Not sure), customer/team/both focus, 90-day and long-term goals, strengths, challenges, weekly time and motivation. These are normalized, saved, and included in scoped AI context. Missing optional coaching answers do not block setup or saving.
