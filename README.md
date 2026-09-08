# @ngelekanyo/payfast

Unified PayFast subscription toolkit, published as one package with three subpath exports:

- `@ngelekanyo/payfast/core` — signature generation, ITN payload/validation helpers, and the PayFast config loader. Framework-agnostic, usable standalone.
- `@ngelekanyo/payfast/server` — an Express router built on top of `/core` that exposes the initiate/notify/cancel/pause/unpause/fetch endpoints.
- `@ngelekanyo/payfast/client` — a browser client (`PayFastService`) for calling that router from the frontend and submitting the PayFast redirect form.

All three subpaths share a single set of types from `src/types`, so `PaymentData` and the other shapes are identical whether you're on the backend or in the browser.

## Installation

```bash
npm install @ngelekanyo/payfast
```

## Environment setup (server)

```env
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_API_VERSION=v1
PAYFAST_RETURN_URL=https://yourdomain.com/payment-success
PAYFAST_CANCEL_URL=https://yourdomain.com/payment-cancel
PAYFAST_NOTIFY_URL=https://yourdomain.com/api/payfast/notify
TESTING_MODE=true
```

## `/core`

```ts
import {
  generateSignatureForInitiate,
  pfValidSignature,
  generateApiSignature,
  createITNPayload,
  validateITNWithPayfast,
  isPayfastSourceIp,
  payfastConfig,
} from "@ngelekanyo/payfast/core";

const signature = generateSignatureForInitiate(paymentData, payfastConfig.passphrase);
```

## `/server`

```ts
import express from "express";
import cors from "cors";
import { buildPayfastRouter } from "@ngelekanyo/payfast/server";

const app = express();

const onPaymentUpdate = async (itnData) => {
  // update database, activate subscription
};
const onCancel = async ({ token, subscriptionId, status, payload }) => {};
const onPause = async ({ token, status, payload }) => {};
const onUnpause = async ({ token, status, payload }) => {};
const onFetch = async ({ token, status, payload }) => {};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api/payfast",
  buildPayfastRouter(onPaymentUpdate, onCancel, onPause, onUnpause, onFetch)
);

app.listen(6000);
```

### Exposed routes

| Method | Route                                        | Description                                   |
| ------ | --------------------------------------------- | ---------------------------------------------- |
| POST   | `/api/payfast/initiate`                       | Generate PayFast payment data + URL            |
| POST   | `/api/payfast/notify`                         | Handle ITN (Instant Transaction Notification)  |
| POST   | `/api/payfast/cancel/:token/:subscriptionId`  | Cancel an active PayFast subscription          |
| POST   | `/api/payfast/cancel/:token`                  | Cancel an active PayFast subscription          |
| POST   | `/api/payfast/pause/:token`                   | Pause an active subscription                   |
| POST   | `/api/payfast/unpause/:token`                 | Unpause a paused subscription                  |

`/initiate` builds a once-off payment by default. Include `subscription_type`
in the request body to opt into a recurring subscription instead — this adds
`billing_date`/`recurring_amount`/`frequency`/`cycles` with sensible
defaults. `return_url`/`cancel_url` can be overridden per request (falling
back to the configured defaults), and `custom_str1`-`custom_str5` are passed
through to PayFast and returned unchanged in the ITN payload.
| GET    | `/api/payfast/fetch/:token`                   | Fetch subscription details                     |

`express` and `cors` are optional peer dependencies — install them yourself when using `/server`; `/client` consumers don't need them.

## `/client`

```ts
import { initPayFastClient, PayFastService } from "@ngelekanyo/payfast/client";
import type { PaymentData } from "@ngelekanyo/payfast/client";

initPayFastClient("https://your-backend.com");

const paymentData: PaymentData = {
  amount: "99.00",
  item_name: "Pro Plan",
  m_payment_id: "uuid-123",
};

const payfast = new PayFastService();
const response = await payfast.initiatePayment(paymentData);
payfast.submitPayment(response.paymentData, response.payfastUrl);

await payfast.pauseSubscription(token);
await payfast.unpauseSubscription(token);
await payfast.cancelSubscription(token);
await payfast.cancelSubscriptionById(token, subscriptionId);
await payfast.fetchSubscription(token);
```

### Authenticating subscription actions

If your backend verifies that the caller actually owns the subscription being paused, resumed, cancelled, or fetched, wire up an auth token provider so those requests carry an `Authorization: Bearer <token>` header:

```ts
import { setAuthTokenProvider } from "@ngelekanyo/payfast/client";

setAuthTokenProvider(async () => {
  const session = await getCurrentSession();
  return session?.accessToken ?? null;
});
```

The provider can be sync or async, and returning `null` simply omits the header. Every method sends it when a provider is configured, including `initiatePayment` — if your backend creates the payment record before calling `/initiate` (e.g. inserting a `pending` subscription row the caller owns via RLS, then passing its id as `m_payment_id`), your backend can use this header to verify the caller actually owns that record before signing a payment for it.

## Security

- Validates PayFast's signature on every ITN
- Verifies source IP matches PayFast domains (skipped in sandbox mode)
- Uses CSRF/session token for authenticated subscription actions, with retry on expired CSRF/session (HTTP 419)
- `/server`'s router itself does not verify that the caller owns a given subscription token — it trusts whatever your callbacks and your own middleware decide. If that matters for your app, use `/client`'s `setAuthTokenProvider` to attach a session token to subscription-action requests, and check ownership against it in middleware on your backend before those requests reach this router.

## Pause/unpause disclaimer

Pausing a subscription does not cancel it — it only delays future billing by the number of paused cycles, and PayFast extends the subscription end date accordingly. Unpausing early does not adjust the next billing date; billing still resumes after the full pause duration. This package does not manage user access during a pause period — enforce that in your own backend. See the [PayFast Developer Docs](https://developers.payfast.co.za/docs) for current details.

## Development

```bash
npm install
npm run build   # emits ESM to dist/ and CJS to dist/cjs/
npm test
```

## License

MIT — see [LICENSE](./LICENSE).
