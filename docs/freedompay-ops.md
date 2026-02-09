# FreedomPay Ops Cheat Sheet

Quick, non-technical summary for support/operations.

## What We Did
- Connected FreedomPay payment creation.
- Added server callback handling (result URL).
- Orders are updated automatically after payment result.

## How It Works (Simple)
1. Customer chooses a plan and gets a payment link.
2. Customer pays on FreedomPay page.
3. FreedomPay notifies our server (result callback).
4. We mark the order as paid or failed.
5. If paid, the customer receives access/invite.

## What Must Be True
- Result URL is public and reachable (no login, no query params).
- Success/Failure URLs are valid (browser redirects).
- Merchant credentials are valid.

## What Support Can Check
- Order status:
  - `pending` = payment started
  - `paid` = payment success
  - `failed` = payment failed
- If user paid but no access:
  - check if callback arrived
  - check order status update

## Common Issues
- No callback received:
  - Result URL not public
  - Wrong URL configured
- Payment done but status still pending:
  - callback failed signature or parsing
  - callback returned non-200

## Who to Contact
- FreedomPay support for API/credentials.
- Internal dev team for callback or order issues.
