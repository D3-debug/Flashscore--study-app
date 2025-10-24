# Stripe Payment Integration Guide

## Overview

This project has a secure Stripe payment processing system with backend API routes, frontend components, and proper authentication. However, **to accept real payments in production**, you must integrate Stripe.js/Elements on the frontend.

## Current Implementation Status

### ✅ Completed (Secure)

1. **Backend Payment API** (`apps/backend/src/routes/stripe.ts`)
   - `/api/stripe/create-payment-intent` - Creates payment intents (authenticated)
   - `/api/stripe/confirm-payment` - Checks payment status (authenticated)
   - `/api/stripe/transactions` - Gets user's payment history (authenticated)
   - `/api/stripe/webhook` - Handles Stripe webhooks

2. **Payment Model** (`apps/backend/src/models/Payment.ts`)
   - Stores payment transactions in MongoDB
   - Tracks payment status, amount, currency, provider
   - Supports age verification and minor transaction limits

3. **Authentication & Security**
   - All payment endpoints require JWT authentication
   - User age and consent fetched from trusted User model (not request body)
   - Age restrictions: Under 13 blocked, 13-17 require parental consent
   - Transaction limits for minors: $50 maximum

4. **Frontend API Routes** (`apps/frontend/src/app/api/payments/`)
   - Proxy routes that forward authenticated requests to backend
   - Properly pass authorization headers

### ⚠️ Todo for Production

#### 1. Integrate Stripe.js on Frontend

The current frontend payment component is a **DEMO** and does NOT collect real card details.

**Install Stripe.js:**
```bash
cd apps/frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Set up environment variable:**
```env
# apps/frontend/.env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Wrap app with Stripe provider:**
```tsx
// apps/frontend/src/app/layout.tsx or similar
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function RootLayout({ children }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
```

**Update Payment Component to use Stripe Elements:**
```tsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

function PaymentForm({ accessToken }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Create payment intent
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ amount: 10.00, currency: 'USD' }),
    });
    
    const { clientSecret } = await response.json();

    // 2. Confirm payment with Stripe.js
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.error) {
      console.error(result.error.message);
    } else if (result.paymentIntent.status === 'succeeded') {
      console.log('Payment succeeded!');
      // Webhook will update database automatically
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>Pay</button>
    </form>
  );
}
```

#### 2. Configure Webhook Raw Body Handling

For Stripe webhook signature verification to work, you need raw request bodies.

**Option A: Use fastify-raw-body plugin:**
```bash
cd apps/backend
npm install fastify-raw-body
```

```typescript
// apps/backend/src/index.ts
import rawBody from 'fastify-raw-body';

await fastify.register(rawBody, {
  field: 'rawBody',
  global: false,
  routes: ['/api/stripe/webhook'],
});
```

**Option B: Custom content type parser:**
```typescript
// apps/backend/src/index.ts
fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'buffer' },
  async (req, body) => {
    req.rawBody = body;
    return JSON.parse(body.toString());
  }
);
```

#### 3. Set up Stripe Webhooks

1. **Get webhook secret from Stripe Dashboard:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Copy the webhook signing secret

2. **Add to environment:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. **Subscribe to events:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`

## Security Features

### Age Verification & Minor Protection

- **Under 13**: Payment processing blocked entirely
- **13-17**: Requires parental consent, $50 transaction limit
- **18+**: No restrictions

Age and consent data is fetched from the authenticated user's profile in the database, not from request payloads.

### Authentication

All payment endpoints require JWT authentication:
- `Authorization: Bearer <access_token>` header required
- User ID derived from token, not request body
- Prevents userId spoofing and unauthorized transactions

## API Endpoints

### Create Payment Intent
```http
POST /api/stripe/create-payment-intent
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 10.00,
  "currency": "USD",
  "description": "Purchase description"
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 1000,
  "currency": "usd"
}
```

### Confirm Payment
```http
POST /api/stripe/confirm-payment
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "...",
    "amount": 10.00,
    "currency": "USD",
    "status": "succeeded",
    "createdAt": "2025-10-24T00:00:00.000Z"
  }
}
```

### Get Transactions
```http
GET /api/stripe/transactions?limit=50&status=succeeded
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

## Testing

### Test with Stripe Test Cards

Use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Any future expiry date, any CVC, any ZIP.

### Test Webhooks Locally

Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
stripe trigger payment_intent.succeeded
```

## Environment Variables

```env
# Backend (.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend (.env.local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Deployment Checklist

- [ ] Install Stripe.js on frontend
- [ ] Integrate Stripe Elements for card collection
- [ ] Install and configure fastify-raw-body for webhooks
- [ ] Set up Stripe webhook endpoint in dashboard
- [ ] Add STRIPE_WEBHOOK_SECRET to production environment
- [ ] Switch to live Stripe keys (pk_live_..., sk_live_...)
- [ ] Test payment flow end-to-end
- [ ] Test webhook events
- [ ] Monitor Stripe Dashboard for errors

## Resources

- [Stripe.js Documentation](https://stripe.com/docs/js)
- [Stripe React Elements](https://stripe.com/docs/stripe-js/react)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Fastify Raw Body Plugin](https://github.com/Eomm/fastify-raw-body)

## Support

For issues with the payment system:
1. Check backend logs for errors
2. Verify environment variables are set
3. Test with Stripe test cards
4. Check Stripe Dashboard for webhook delivery status
5. Review this documentation for missing setup steps
