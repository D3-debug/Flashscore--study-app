
# Stripe Payment Integration Setup Guide

## Overview

This guide covers the complete setup of Stripe payments with proper security, authentication, and age verification.

## Security Architecture

### Authentication Flow
1. User must be signed in with valid JWT token
2. Frontend sends token in `Authorization: Bearer <token>` header
3. Backend validates token and extracts userId
4. User age/consent fetched from database (NOT from request)

### Age Protection
- **Under 13**: Blocked completely (COPPA compliance)
- **13-17**: Require parental consent + $50 transaction limit
- **18+**: Full access

## Environment Variables

### Backend (.env)
```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_51xxxxx  # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Set up after webhook creation

# MongoDB (required for user verification)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/magajico_db

# JWT (required for authentication)
JWT_SECRET=your-secret-key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
NEXT_PUBLIC_BACKEND_URL=http://0.0.0.0:3001
```

## Installation Steps

### 1. Install Stripe Packages

Backend is already set up. For frontend:

```bash
cd apps/frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Set Up Environment Variables

Use the Secrets tool in Replit:
1. Click Tools → Secrets
2. Add the following secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (after step 4)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 3. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → API keys
3. Copy your publishable key (pk_test_...)
4. Copy your secret key (sk_test_...)

### 4. Configure Webhook for Production

1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://your-app.replit.app/api/stripe/webhook`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copy the webhook signing secret (whsec_...)

### 5. Update Frontend with Stripe Elements

Replace the demo payment form in `apps/frontend/src/app/components/StripePaymentForm.tsx` with:

```tsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function StripePaymentForm({ amount, currency, description, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      
      // Step 1: Create payment intent (with auth)
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount, currency, description }),
      });

      const { clientSecret, error } = await response.json();
      if (error) throw new Error(error);

      // Step 2: Confirm payment with Stripe.js
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      onSuccess?.(result.paymentIntent);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>
    </form>
  );
}
```

### 6. Wrap App with Stripe Provider

In `apps/frontend/src/app/layout.tsx`:

```tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Elements stripe={stripePromise}>
          {children}
        </Elements>
      </body>
    </html>
  );
}
```

## Testing

### Test Cards

Use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry, any CVC, any ZIP code.

### Test Webhooks Locally

```bash
# Install Stripe CLI
stripe listen --forward-to http://0.0.0.0:3001/api/stripe/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

## Security Checklist

- [x] Authentication required on all payment endpoints
- [x] User age fetched from database, not request body
- [x] JWT token validation on backend
- [x] Age restrictions enforced (COPPA compliant)
- [x] Transaction limits for minors ($50 max)
- [x] Webhook signature verification enabled
- [x] No sensitive data in frontend code
- [x] PCI compliance via Stripe.js (no card data touches server)

## API Endpoints

### POST /api/payments/create-intent
Creates a payment intent with age verification.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
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
  "paymentIntentId": "pi_xxx"
}
```

### POST /api/payments/confirm
Confirms payment status after Stripe.js confirmation.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Body:**
```json
{
  "paymentIntentId": "pi_xxx"
}
```

## Troubleshooting

### "Authentication required" error
- Ensure user is signed in
- Check JWT token is valid and not expired
- Verify Authorization header is set correctly

### "Age restriction" errors
- Check user profile has age field set
- For 13-17: Ensure parentalConsent is true in user profile
- For under 13: Payment is blocked by design (COPPA)

### Webhook signature verification fails
- Set STRIPE_WEBHOOK_SECRET in environment
- Ensure webhook endpoint URL matches Stripe Dashboard
- Check request body is raw (not parsed JSON)

### Payment succeeds but database not updated
- Check webhook is configured in Stripe Dashboard
- Verify STRIPE_WEBHOOK_SECRET is set
- Check backend logs for webhook processing errors

## Production Deployment

1. Switch to live Stripe keys (pk_live_..., sk_live_...)
2. Update webhook URL to production domain
3. Enable HTTPS (automatic on Replit deployments)
4. Test payment flow end-to-end
5. Monitor Stripe Dashboard for errors

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements Guide](https://stripe.com/docs/stripe-js/react)
- [COPPA Compliance](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

## Related Documentation

- [STRIPE_INTEGRATION.md](../STRIPE_INTEGRATION.md) - Technical implementation details
- [SECURITY.md](../SECURITY.md) - Overall security policy
- [COPPA_POLICY.md](./COPPA_POLICY.md) - Children's privacy compliance
