# MOD Google verification preparation
Prepared September 29, 2026. This is a preparation record, not a claim of Google approval.

## Branding values
- App name: Marina On Demand
- Homepage: https://app.marinaondemand.com/about
- Privacy policy: https://app.marinaondemand.com/privacy
- Terms: https://app.marinaondemand.com/terms
- Authorized domain: marinaondemand.com
- Production redirect: https://app.marinaondemand.com/api/connections/oauth/callback
- Technical/privacy contact used on the public pages: donnavaldes@gmail.com
- Use an app support email that the operator monitors in Google Branding.

The previously entered https://marinasimone.com/privacy-policy redirected to /home when checked. Replace that value with the dedicated MOD policy. Review the new policy and confirm actual provider settings, support process, and organization obligations before making verification attestations.

## App description for submission
Marina On Demand is a member-based AI marketing and productivity assistant. Members save brand and business context, request writing and marketing guidance, and optionally connect Google services. Gmail supports requested email searches, summaries and draft preparation. Calendar supports schedule review and approved event creation. Drive supports finding file details and approved exports of prepared content as new Google Docs or supported uploads. Each external write requires individual member approval. Relevant requested Google results are processed by OpenAI to prepare responses and can be reflected in saved chat or action records. Google data is not used for advertising or generalized model training.

## Declared scopes and purpose
All scope names below have prefix https://www.googleapis.com/auth/.

| Scope | Implemented purpose | Review consideration |
| --- | --- | --- |
| gmail.readonly | Search messages and read selected messages for requested summaries and reply preparation. | Restricted. Required for existing inbox functionality. Demonstrate search and read. |
| gmail.compose | Create Gmail drafts and send only after individual approval. | Restricted. gmail.send alone cannot create drafts. Demonstrate draft and send with a controlled test recipient. |
| calendar.calendarlist.readonly | List calendars so members can identify the calendar for their request. | Demonstrate calendar list. |
| calendar.events.readonly | Read events in View Only mode. | Needed separately while read-only mode remains supported. |
| calendar.events | Create approved events in action mode. | Broader API scope also allows changes/deletion; MOD currently exposes creation only. |
| drive.metadata.readonly | Search/list files and retrieve metadata across Drive. | Restricted. The prepared change requests metadata access only. Existing drive.readonly connections remain compatible. Validate consent in staging before production rollout. |
| drive.file | Create a new Google Doc from supplied text and save supported uploaded files. | Narrow file-level scope. Existing document export uses the Drive API, not the Docs API. |

Keep console declarations aligned with actual runtime scopes. Do not claim drive.readonly is the minimum available permission for metadata-only operations. A scope redesign needs code and consent-flow updates, not just removal from the console.

## Data flow and retention review
1. The member signs into MOD and chooses a connection and permission mode.
2. Google OAuth uses PKCE, a single-use expiring state and server-side code exchange.
3. Credentials are held server-side through Supabase Vault-backed transitions; refresh retains an existing refresh token if Google omits a replacement.
4. Requested reads are sent to Google. Relevant results enter the AI response context and may appear in saved answers. Proposed writes and their results are saved in action records.
5. Approval permits a supported Google write. Declining does not execute the write.
6. Disconnect clears that connection's locally stored credentials. Google-wide revocation is available through Google Account connections.
7. Users can delete chat/workspace items and clear memory. Full account/uploads/action-record deletion is currently a support process, not a single self-service button. Confirm and document that operational deletion procedure and backup retention before submission.
8. Confirm AI provider data-sharing/training settings and all subprocessors match the published Google Limited Use commitment. Do not attest to a provider retention period or zero retention without evidence.

## Domain and deployment tasks still requiring console access
- Verify marinaondemand.com ownership in Google Search Console using a Google project Owner/Editor account. If DNS verification is selected, use Google's actual TXT token; it cannot be invented.
- Set Vercel Production NEXT_PUBLIC_SITE_URL to https://app.marinaondemand.com and redeploy if needed. Its current deployed value has not been verified.
- Confirm the production OAuth client is the one identified by GOOGLE_CLIENT_ID. Preserve existing credentials; changing domains does not require a new secret.
- Confirm Gmail API, Calendar API and Drive API are enabled.
- Before the production verification submission, retire the old vercel.app callback once active flows are migrated. Keep test/development clients in a separate Google Cloud project as Google requires. Do not delete a working callback before the migration is verified.
- Enter the published Branding URLs above and verify branding. Audience currently shows External / Testing.
- Move to Production as part of the submission workflow. Publishing is not approval and does not itself remove the unverified-app restrictions.

## Demonstration recording checklist
Use a test mailbox and dummy documents/events. Avoid exposing real customer data, API keys, tokens or client secrets.
1. Show MOD public About and Privacy pages, then member sign-in.
2. Open My MOD Settings and connect each Google service. Show the English Google consent flow, app name, client ID in the consent URL and requested scopes.
3. Gmail: search a controlled message, summarize it, create a draft after approval, verify the draft in Gmail. Demonstrate separately approved sending to a controlled test inbox if send remains in scope.
4. Calendar: list calendars, read a test event, approve creation of a new test event and show the result in Google Calendar.
5. Drive: search/list a controlled file and show metadata. Approve a new Google Doc export and open it. Approve a supported uploaded file export and show it in Drive.
6. Show a declined proposal and connection View Only mode to explain action controls.
7. Show disconnect, Google authorization revocation and the privacy page's deletion-request instructions.
8. Upload the recording as an unlisted YouTube video. Use its actual URL in the verification submission.

## Remaining launch dependency
The Gmail restricted scopes and server-side processing can require a Google-approved annual security assessment (CASA) for production verification. This packet does not perform or certify that assessment. Google review decides eligibility and requests evidence. Do not promise immediate approval, a fixed completion date, or a fixed assessment cost.

Official references:
- https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification
- https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- https://developers.google.com/terms/api-services-user-data-policy
- https://developers.google.com/workspace/gmail/api/auth/scopes
- https://developers.google.com/workspace/drive/api/guides/api-specific-auth

## Drive scope change, prepared September 30, 2026
Runtime changes are prepared on a separate branch, not deployed to production. Replace drive.readonly with drive.metadata.readonly in the verification scope list after staging validation. Keep drive.file for approved document creation and attachment export. Record the matching consent flow before submitting.

Final Drive justification after rollout:
Marina on Demand uses drive.metadata.readonly to let users search their connected Google Drive and view file names, descriptions, types, modification dates, and links. It does not download or read existing file contents. drive.file alone cannot search metadata across existing files that have not been opened with the app. The separate drive.file scope supports creating Google Docs and exporting user-approved attachments.
