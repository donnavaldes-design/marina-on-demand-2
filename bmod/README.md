# BMOD capability architecture

The operation manifest is the source of truth for requested OAuth scopes, read/write classification, validation and UI capability status. Marketplace selection is an audited upper bound, not evidence of a token grant.

Every provider operation is gated by the current saved token scopes. The router never accepts a URL, HTTP method, location ID or approval boolean from the model. The server supplies the connected location. Provider data is untrusted content.

Connections default to `view_only`. `view_and_take_action` permits write preparation; execution remains blocked pending a server-verified Action Mode approval bridge. The existing external action queue remains unchanged. A future executor must bind approval to user, connection, location, operation and exact payload, claim it once transactionally, recheck mode/scopes at dispatch, and support idempotency. A model-supplied approval is never sufficient.

Token refresh preserves the permission mode, atomically stores the rotated token pair, and updates granted scopes only when HighLevel returns them. Missing permissions cause reauthorization notices, never a disconnected status.
