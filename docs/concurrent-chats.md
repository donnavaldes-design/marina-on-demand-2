# Concurrent chats, beta

Each send captures its conversation, business, mode, attachments and originating user before asynchronous work begins. Running requests retain independent local snapshots. Users can open New chat or select a different conversation while the first request continues. Sidebar labels show Working, Ready, or Needs attention. A response never changes a different active conversation. Failed requests retain their original draft and files in their own conversation. Temporary IDs cover new chats until the server returns a persisted ID.

This is open-tab concurrency, not a durable server job queue. Keep MOD open while work runs; refreshing or closing the tab loses local progress indicators and may interrupt the request. Completed messages persist through the existing server pipeline. Different browser tabs do not synchronize in-flight indicators. Existing image generation keeps its own job behavior. Do not promise completion after browser closure.

Tests cover reversed completion order, business and attachment isolation, failed background drafts, and newly created IDs. Reopened completed chats reload server state to include subsequent action approvals.
