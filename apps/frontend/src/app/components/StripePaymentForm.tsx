"use client";

import React, { useState } from 'react';

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  description: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

/**
 * Stripe Payment Form Component
 * 
 * SECURITY FEATURES:
 * - Requires JWT authentication (accessToken must be passed)
 * - Age verification performed server-side from user database
 * - No sensitive user data in request body
 * - Stripe.js handles card details securely (PCI compliant)
 * 
 * PRODUCTION SETUP:
 * 1. Install: npm install @stripe/stripe-js @stripe/react-stripe-js
 * 2. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in environment
 * 3. Use real Stripe Elements instead of demo form below
 * 
 * See STRIPE_INTEGRATION.md for complete setup instructions.
 */

interface StripePaymentFormProps {
  accessToken: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  accessToken,
  onSuccess,
  onError,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const amountNum = parseFloat(amount);

      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Step 1: Create payment intent (authenticated)
      const intentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount: amountNum,
          currency: 'USD',
          description: description || 'Payment',
        }),
      });

      const intentData = await intentResponse.json();

      if (!intentResponse.ok) {
        throw new Error(intentData.error || 'Failed to create payment intent');
      }

      // Step 2: In a real app, you would use Stripe.js here to collect card details
      // Example: const result = await stripe.confirmCardPayment(intentData.clientSecret, {...});
      // For demo purposes, we'll just check the payment status
      console.log('Payment Intent Created:', intentData.paymentIntentId);
      console.log('Client Secret (use with Stripe.js):', intentData.clientSecret);

      // Step 3: Check payment status (in production, webhooks handle this automatically)
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          paymentIntentId: intentData.paymentIntentId,
        }),
      });

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Failed to confirm payment');
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess(confirmData.payment?.id || intentData.paymentIntentId);
      }

      // Reset form
      setAmount('');
      setDescription('');
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      padding: '24px',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
    }}>
      <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '600' }}>
        💳 Make a Payment
      </h2>

      <div style={{
        padding: '12px',
        backgroundColor: '#fef3c7',
        borderLeft: '4px solid #f59e0b',
        marginBottom: '16px',
        borderRadius: '4px',
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', fontWeight: '600' }}>
          ⚠️ DEMO MODE
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#92400e' }}>
          This component creates payment intents but does not collect card details.
          Integrate Stripe Elements for production use.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            fontSize: '0.95rem',
          }}>
            Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            fontSize: '0.95rem',
          }}>
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this payment for?"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            borderLeft: '4px solid #ef4444',
            marginBottom: '16px',
            borderRadius: '4px',
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b' }}>
              ❌ {error}
            </p>
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px',
            backgroundColor: '#d1fae5',
            borderLeft: '4px solid #10b981',
            marginBottom: '16px',
            borderRadius: '4px',
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#065f46' }}>
              ✅ Payment successful!
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !amount}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: loading || !amount ? '#9ca3af' : '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading || !amount ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {loading ? 'Processing...' : `Pay $${amount || '0.00'}`}
        </button>
      </form>

      export default function StripePaymentForm({ 
  amount, 
  currency = 'USD', 
  description,
  onSuccess,
  onError 
}: StripePaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get authentication token (in production, get from session/context)
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('Authentication required. Please sign in.');
      }

      // Step 1: Create payment intent with authentication
      const intentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
        }),
      });

      const intentData = await intentResponse.json();

      if (!intentResponse.ok) {
        // Handle age restrictions
        if (intentData.code === 'AGE_RESTRICTION_UNDERAGE') {
          throw new Error(intentData.error);
        }
        if (intentData.code === 'PARENTAL_CONSENT_REQUIRED') {
          throw new Error('Parental consent required. Please have a parent/guardian complete the consent process in settings.');
        }
        if (intentData.code === 'MINOR_AMOUNT_LIMIT_EXCEEDED') {
          throw new Error(`Transaction exceeds minor limit of $${intentData.maxAmount}`);
        }
        throw new Error(intentData.error || 'Failed to create payment');
      }

      const { clientSecret, paymentIntentId } = intentData;

      // Step 2: In production, use Stripe.js to confirm payment
      // const stripe = useStripe();
      // const result = await stripe.confirmCardPayment(clientSecret, {
      //   payment_method: { card: elements.getElement(CardElement) }
      // });

      // DEMO: Simulate successful payment
      console.log('Payment Intent Created:', paymentIntentId);
      console.log('⚠️ In production, use Stripe Elements to collect card and confirm payment');

      // Step 3: Confirm payment status
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          paymentIntentId,
        }),
      });

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        onSuccess?.(confirmData.payment);
      } else {
        throw new Error(confirmData.error || 'Payment confirmation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3>Payment Details</h3>
        <p>Amount: ${amount.toFixed(2)} {currency}</p>
        <p>Description: {description}</p>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#92400e',
      }}>
        ⚠️ <strong>Demo Mode:</strong> This is a demo. Install Stripe Elements for production.
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#1e40af',
      }}>
        🔒 <strong>Security:</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>Age verified from your profile (server-side)</li>
          <li>JWT authentication required</li>
          <li>Stripe handles card details securely</li>
          <li>Minors protected with transaction limits</li>
        </ul>
      </div>
    </div>
  );
}
    </div>
  );
};
