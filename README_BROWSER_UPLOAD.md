# Marina On Demand 2.4.1 — Multi-Source GHL Entitlements

Flat browser-upload build. No folders.

Upload these four files to the ROOT of the existing GitHub repository and replace the current files:

- api.js
- index.html
- vercel.json
- README_BROWSER_UPLOAD.md

Build marker:
2.4.1-multisource-entitlements

Important fix:
Access is now multi-source.

A customer can simultaneously have:
- direct MOD access
- BMOD-included access
- monthly or annual direct access
- admin access

An inactive event for one source will NOT revoke another still-active source.

Supported source values:
- monthly
- annual
- direct
- bmod
- admin
- prototype

Recommended mapping for the current four BMOD workflows:

1. BMOD Sale and Active Subscription
   active=true
   source=bmod

2. BMOD Inactive Subscription
   active=false
   source=bmod

3. MOD Tag, Onboarding +AC v2
   active=true
   source=direct

4. MOD Inactive Revoke Access
   active=false
   source=direct

If the direct MOD workflow is later split cleanly into monthly vs annual, change source from direct to monthly or annual without changing the app architecture.

Keep:
PROTOTYPE_ALLOW_ALL_AUTHENTICATED=true

Do not enforce production access until active/inactive webhook tests pass.
