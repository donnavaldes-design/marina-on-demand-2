# BMOD Tools permission and capability audit

Audited September 22, 2026. Base production commit: c720174739c4cffde45f2b66341ad868596fa4c1. Manifest 2026-09-22.1.

## Findings

- Marketplace Auth selected 120 scopes. The exact selection is recorded in [marketplace-scopes.json](marketplace-scopes.json). It is an audited snapshot, not a live Marketplace synchronization API. Re-audit that snapshot whenever app configuration changes. Startup/tests reject supported scopes absent from the audited selection.
- Production environment lists HIGHLEVEL_CLIENT_ID and HIGHLEVEL_CLIENT_SECRET, but no HIGHLEVEL_SCOPES override. Values were never revealed. The preceding app requested eight scopes; the current connected token has only locations.readonly, contacts.readonly, opportunities.readonly, pipelines.readonly and workflows.readonly.
- Previous tools exposed four CRM reads plus four funnel reads. CRM permissions were not checked individually. The callback treated requested scopes as granted when a token response omitted scopes. The database token saver reset read_only and hard-coded four tools on every refresh.

## Architecture and authorization

- [manifest.js](manifest.js) defines 43 read operations and 8 write preparations. OAuth, discovery, validation, capability display and dispatch use this registry. One model tool, bmod_read, supports describe_operations plus a validated parameters_json payload. No arbitrary URL or method is accepted.
- View only requests 37 curated read scopes. View and take action adds only 6 curated write scopes. HIGHLEVEL_SCOPES is now a deprecated diagnostic input; it cannot silently override the manifest.
- UI lists granted capabilities, exact missing permissions and Update permissions without downgrading CONNECTED. Changing connection mode does not execute any action.
- Granted token scopes remain authoritative. Callback scope omission produces an unknown/empty grant rather than inventing permissions. Refresh scope omission preserves the previous grant; an explicit empty scope clears it. Every provider dispatch rechecks required scopes after refresh, including 401 refresh/retry.
- Atomic Vault pair storage, database leases, callback state consumption, disconnect fencing, native tests and Marina voice are preserved. Permission mode survives refresh.
- No write executor is enabled. Both modes block external mutation. Action mode permits validated proposals only; the existing Action Mode queue remains in place. A future bridge must validate ownership, exact payload approval, location, mode and scopes, then claim a single-use approval and apply idempotency before dispatch.

## Final supported scopes

### View only

- `adPublishing.readonly`
- `blogs/list.readonly`
- `blogs/posts.readonly`
- `calendars.readonly`
- `calendars/events.readonly`
- `contacts.readonly`
- `conversations.readonly`
- `conversations/message.readonly`
- `emails/campaigns.readonly`
- `emails/stats.readonly`
- `emails/templates.readonly`
- `forms.readonly`
- `funnels/funnel.readonly`
- `funnels/page.readonly`
- `funnels/pagecount.readonly`
- `funnels/redirect.readonly`
- `invoices.readonly`
- `invoices/estimate.readonly`
- `knowledge-bases.readonly`
- `locations.readonly`
- `locations/customFields.readonly`
- `locations/tags.readonly`
- `medias.readonly`
- `objects/record.readonly`
- `objects/schema.readonly`
- `opportunities.readonly`
- `payments/orders.readonly`
- `payments/subscriptions.readonly`
- `payments/transactions.readonly`
- `pipelines.readonly`
- `products.readonly`
- `products/collection.readonly`
- `products/prices.readonly`
- `socialplanner/account.readonly`
- `socialplanner/post.readonly`
- `surveys.readonly`
- `workflows.readonly`

### Additional scopes for View and take action

- `blogs/post.write`
- `contacts.write`
- `emails/templates.write`
- `funnels/redirect.write`
- `opportunities.write`
- `socialplanner/post.write`

## Operation contracts

| Operation | Family | Class | Method and endpoint | Required scope |
|---|---|---|---|---|
| get_location | Account | Read | GET /locations/:locationId | locations.readonly |
| search_contacts | Contacts | Read | POST /contacts/search | contacts.readonly |
| get_contact | Contacts | Read | GET /contacts/:contactId | contacts.readonly |
| search_opportunities | Opportunities | Read | GET /opportunities/search | opportunities.readonly |
| list_pipelines | Pipelines | Read | GET /opportunities/pipelines | pipelines.readonly |
| list_workflows | Workflows | Read | GET /workflows/ | workflows.readonly |
| search_conversations | Conversations / messages | Read | GET /conversations/search | conversations.readonly |
| list_messages | Conversations / messages | Read | GET /conversations/:conversationId/messages | conversations/message.readonly |
| list_calendars | Calendars / events | Read | GET /calendars/ | calendars.readonly |
| list_calendar_events | Calendars / events | Read | GET /calendars/events | calendars/events.readonly |
| list_contact_tasks | Tasks / tags / custom fields | Read | GET /contacts/:contactId/tasks | contacts.readonly |
| list_tags | Tasks / tags / custom fields | Read | GET /locations/:locationId/tags | locations/tags.readonly |
| list_custom_fields | Tasks / tags / custom fields | Read | GET /locations/:locationId/customFields | locations/customFields.readonly |
| list_funnels | Funnels / pages / redirects | Read | GET /funnels/funnel/list | funnels/funnel.readonly |
| latest_funnel | Funnels / pages / redirects | Read | GET /funnels/funnel/list | funnels/funnel.readonly |
| list_funnel_pages | Funnels / pages / redirects | Read | GET /funnels/page | funnels/page.readonly |
| count_funnel_pages | Funnels / pages / redirects | Read | GET /funnels/page/count | funnels/pagecount.readonly |
| list_redirects | Funnels / pages / redirects | Read | GET /funnels/lookup/redirect/list | funnels/redirect.readonly |
| list_blogs | Blogs | Read | GET /blogs/site/all | blogs/list.readonly |
| list_blog_posts | Blogs | Read | GET /blogs/posts/all | blogs/posts.readonly |
| list_email_templates | Email templates / campaigns / schedules / stats | Read | GET /emails/locations/:locationId/templates | emails/templates.readonly |
| list_email_campaigns | Email templates / campaigns / schedules / stats | Read | GET /emails/locations/:locationId/campaigns/emails | emails/campaigns.readonly |
| list_scheduled_emails | Email templates / campaigns / schedules / stats | Read | GET /emails/locations/:locationId/campaigns/emails | emails/campaigns.readonly |
| get_email_stats | Email templates / campaigns / schedules / stats | Read | GET /emails/locations/:locationId/campaigns/stats/:source/:sourceId | emails/stats.readonly |
| list_forms | Forms | Read | GET /forms/ | forms.readonly |
| list_form_submissions | Forms | Read | GET /forms/submissions | forms.readonly |
| list_social_accounts | Social planner | Read | GET /social-media-posting/:locationId/accounts | socialplanner/account.readonly |
| list_social_posts | Social planner | Read | POST /social-media-posting/:locationId/posts/list | socialplanner/post.readonly |
| list_media | Media | Read | GET /medias/files | medias.readonly |
| list_products | Products / prices / collections | Read | GET /products/ | products.readonly |
| list_product_prices | Products / prices / collections | Read | GET /products/:productId/price | products/prices.readonly |
| list_product_collections | Products / prices / collections | Read | GET /products/collections | products/collection.readonly |
| list_orders | Payments / orders / transactions / subscriptions | Read | GET /payments/orders | payments/orders.readonly |
| list_transactions | Payments / orders / transactions / subscriptions | Read | GET /payments/transactions | payments/transactions.readonly |
| list_subscriptions | Payments / orders / transactions / subscriptions | Read | GET /payments/subscriptions | payments/subscriptions.readonly |
| list_invoices | Invoices / estimates | Read | GET /invoices/ | invoices.readonly |
| list_estimates | Invoices / estimates | Read | GET /invoices/estimate/list | invoices/estimate.readonly |
| list_knowledge_bases | Knowledge bases | Read | GET /knowledge-bases/ | knowledge-bases.readonly |
| list_surveys | Surveys | Read | GET /surveys/ | surveys.readonly |
| list_survey_submissions | Surveys | Read | GET /surveys/submissions | surveys.readonly |
| list_custom_objects | Custom objects | Read | GET /objects/ | objects/schema.readonly |
| get_custom_object_record | Custom objects | Read | GET /objects/:schemaKey/records/:recordId | objects/record.readonly |
| get_facebook_ad_report | Ad reporting | Read | GET /ad-publishing/facebook/reporting | adPublishing.readonly |
| create_contact_task | Tasks / tags / custom fields | Write preparation only | POST /contacts/:contactId/tasks | contacts.write |
| add_contact_note | Contacts | Write preparation only | POST /contacts/:contactId/notes | contacts.write |
| add_contact_tags | Tasks / tags / custom fields | Write preparation only | POST /contacts/:contactId/tags | contacts.write |
| update_opportunity_status | Opportunities | Write preparation only | PUT /opportunities/:opportunityId/status | opportunities.write |
| create_url_redirect | Funnels / pages / redirects | Write preparation only | POST /funnels/lookup/redirect | funnels/redirect.write |
| create_blog_draft | Blogs | Write preparation only | POST /blogs/posts | blogs/post.write |
| create_email_template | Email templates / campaigns / schedules / stats | Write preparation only | POST /emails/locations/:locationId/templates | emails/templates.write |
| create_social_draft | Social planner | Write preparation only | POST /social-media-posting/:locationId/posts | socialplanner/post.write |

Parameter schemas, bounded pagination and per-endpoint validation are in the manifest. The router supplies the connected location. ID-only endpoints rely on the HighLevel location token for provider-side resource ownership. No write operation can dispatch.

## API boundaries

- **Courses:** Marketplace selects courses.readonly, but the published Courses reference exposes only course import. No course listing endpoint is invented or requested.
- **Funnels / pages / redirects:** No documented funnel/page content or layout write endpoint in the reviewed public API. Redirect creation is a separate supported preparation.
- **Workflows:** Workflow listing is supported; no workflow-definition editor is documented in the reviewed public API.
- **Forms:** forms.write documents file uploads, not a form-builder editor.
- **Ad publishing:** Publishing endpoints exist. Ad-spend and publish operations are intentionally excluded until the approval/idempotency bridge and budget validation are implemented.
- Email uses the current location-addressed templates/campaigns/stats endpoints. Scheduled emails are obtained by filtering campaigns to scheduled status, avoiding redundant legacy builder/schedule scopes.
- Social posts listing requires numeric strings for pagination. Products collections use altId/altType. These contracts are explicitly encoded and tested.
- Ads reporting uses Marketplace spelling adPublishing.readonly; the aggregate scopes document says adPublishing.readOnly. Live provider acceptance and an existing ad integration remain prerequisites. No automatic case-insensitive scope granting is performed.
- Course read scope is selected, but no course read endpoint was verified in the published reference. Import exists; this release does not request its write scope or invent a listing endpoint.

## Verification

- 40/40 automated tests pass with simulated external services. Covered: connect, actual returned scope inspection, contacts/opportunities/pipelines/workflows/funnels/blogs/email templates/products reads, fresh Connections request, expiry, rotated tokens, repeated reads.
- Scope-denial checks cover every read; mode enforcement covers every write. Parameter injection, arbitrary URL/method, invalid identifiers, publish escalation, bounded 401 retries, narrowed refresh grants, missing scope responses, concurrent refreshes, storage retry and disconnect races are tested.
- Production SQL rollback tests passed for mode persistence, atomic Vault pair writes, scope replacement/omission/empty grant, and original record restoration. No test token or permission-mode change was retained. The new migration is 20260922160908_bmod_capability_permissions.
- Database inspection confirms only service_role has table privileges for user_connections. No new security advisor finding for the new fields/function. Existing unrelated notices remain untouched.
- Syntax and whitespace checks pass. Protected voice/prompts, knowledge and entitlement code were compared against current production and remain byte-for-byte unchanged.
- The shared Marina browser remains signed out. The production grant still contains five scopes, so the requested live expanded-capability cycle is NOT yet verified. Runtime logs previously returned 403.
- Connections now includes Verify reads + refresh: an authenticated, fixed list of eight read operations, one token refresh, then the same reads, with secret-free pass/fail/missing-permission results. After authorization, run it, reload the app, and repeat to finish live persistence verification. It never alters customer records.

## Sources

- https://marketplace.gohighlevel.com/docs/Authorization/Scopes/index.html
- https://marketplace.gohighlevel.com/docs/ghl/contacts/search-contacts-advanced/index.html
- https://marketplace.gohighlevel.com/docs/ghl/opportunities/search-opportunity/index.html
- https://marketplace.gohighlevel.com/docs/ghl/opportunities/get-pipelines/index.html
- https://marketplace.gohighlevel.com/docs/ghl/conversations/get-messages/index.html
- https://marketplace.gohighlevel.com/docs/ghl/calendars/get-calendar-events/index.html
- https://marketplace.gohighlevel.com/docs/ghl/funnels/get-funnels/index.html
- https://marketplace.gohighlevel.com/docs/ghl/funnels/get-pages-by-funnel-id/index.html
- https://marketplace.gohighlevel.com/docs/ghl/blogs/get-blogs/index.html
- https://marketplace.gohighlevel.com/docs/ghl/blogs/get-blog-post/index.html
- https://marketplace.gohighlevel.com/docs/ghl/emails/list-email-templates/index.html
- https://marketplace.gohighlevel.com/docs/ghl/emails/list-email-campaigns/index.html
- https://marketplace.gohighlevel.com/docs/ghl/emails/get-campaign-stats/index.html
- https://marketplace.gohighlevel.com/docs/ghl/social-planner/get-posts/index.html
- https://marketplace.gohighlevel.com/docs/ghl/medias/fetch-media-content/index.html
- https://marketplace.gohighlevel.com/docs/ghl/products/list-invoices/index.html
- https://marketplace.gohighlevel.com/docs/ghl/products/list-prices-for-product/index.html
- https://marketplace.gohighlevel.com/docs/ghl/products/get-product-collection/index.html
- https://marketplace.gohighlevel.com/docs/ghl/invoices/list-invoices/index.html
- https://marketplace.gohighlevel.com/docs/ghl/invoices/list-estimates/index.html
- https://marketplace.gohighlevel.com/docs/ghl/knowledge-base/list-all-knowledge-bases-paginated/index.html
- https://marketplace.gohighlevel.com/docs/ghl/ad-publishing/fb-get-reporting/index.html
- https://marketplace.gohighlevel.com/docs/ghl/contacts/create-task/index.html
- https://marketplace.gohighlevel.com/docs/ghl/funnels/create-redirect/index.html
- https://marketplace.gohighlevel.com/docs/ghl/blogs/create-blog-post/index.html
- https://marketplace.gohighlevel.com/docs/ghl/emails/create-email-template/index.html
- https://marketplace.gohighlevel.com/docs/ghl/social-planner/create-post/index.html
- https://marketplace.gohighlevel.com/docs/ghl/courses/import-courses/index.html
