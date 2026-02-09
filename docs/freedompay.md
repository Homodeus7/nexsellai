# FreedomPay Integration

This doc describes how the backend integrates with FreedomPay (merchant payments).

## Endpoints
- Init payment: `https://api.freedompay.kg/init_payment.php`
- Result callback (merchant): `FREEDOM_PAY_RESULT_URL` (public, no auth, no query params)
- Success URL (browser redirect): `FREEDOM_PAY_SUCCESS_URL`
- Failure URL (browser redirect): `FREEDOM_PAY_FAILURE_URL`

## Environment Variables
```
FREEDOM_PAY_MERCHANT_ID=...
FREEDOM_PAY_SECRET_KEY=...
FREEDOM_PAY_API_BASE_URL=https://api.freedompay.kg
FREEDOM_PAY_RESULT_URL=https://your-domain.com/api/webhooks/freedom
FREEDOM_PAY_SUCCESS_URL=https://your-frontend.com/payment/success
FREEDOM_PAY_FAILURE_URL=https://your-frontend.com/payment/failure
FREEDOM_PAY_TESTING_MODE=1
```

Important: `FREEDOM_PAY_RESULT_URL` must be a clean URL without query params.

## Request Signing (pg_sig)
All requests and responses are signed with MD5. The signature is built as:
1. Script name (last segment of the URL path, e.g. `init_payment.php`).
2. All parameters sorted by key (alphabetical), using values only.
3. Secret key at the end.
4. Join parts with `;` and hash with MD5 (lowercase hex).

`pg_sig` is not included when computing the signature. `pg_salt` must be included.

Implementation lives in `src/services/freedom-pay.ts`.

## Payment Creation Flow
1. Client calls `POST /api/orders` with `plan_id` and optional customer contacts.
2. Server creates the order and calls FreedomPay `init_payment.php` with:
   - `pg_merchant_id`, `pg_order_id`, `pg_amount`, `pg_currency`, `pg_description`
   - `pg_result_url`, `pg_success_url`, `pg_failure_url`
   - `pg_testing_mode`, `pg_salt`, `pg_sig`
3. FreedomPay returns XML with `pg_payment_id` and `pg_redirect_url`.
4. Server returns `payment_url` to the client.

## Result Callback (Result URL)
FreedomPay sends server-to-server callback:
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded`
- Body: form fields including `pg_order_id`, `pg_payment_id`, `pg_result`, `pg_salt`, `pg_sig`, and others.

Expected behavior:
1. Verify `pg_sig` using the same rules.
2. Find order by `pg_payment_id` or `pg_order_id`.
3. If success: mark order as paid, create access, send invite.
4. If failed: mark order as failed.
5. Always respond with HTTP 200 and XML body:
```
<?xml version="1.0" encoding="UTF-8"?>
<response>
  <pg_status>ok</pg_status>
  <pg_description>Accepted</pg_description>
  <pg_salt>...</pg_salt>
  <pg_sig>...</pg_sig>
</response>
```

If verification fails, respond with XML and a non-200 status, but note that FreedomPay will retry on non-200.

## Local Testing Checklist
1. Put real test credentials and URLs into `.env`.
2. Ensure `FREEDOM_PAY_RESULT_URL` is public (use a tunnel if needed).
3. Create order via `POST /api/orders`.
4. Open returned `payment_url` and pay with test card data.
5. Confirm:
   - Callback hits `/api/webhooks/freedom`.
   - Order status updates to `paid` or `failed`.

## Useful Files
- `src/services/freedom-pay.ts`
- `src/routes/orders.ts`
- `src/routes/webhooks.ts`
- `src/config/env.ts`
