import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';
import { Payment } from '@/models';
import { User } from '@/models/User';
import { authenticateToken } from '@/middleware/authMiddleware';
import { validateStripeEnv, getStripeMode } from '@/utils/validateStripeEnv';

const MINIMUM_AGE_FOR_PAYMENTS = 18;
const MINIMUM_AGE_WITH_CONSENT = 13;
const MAX_MINOR_TRANSACTION = 50;

// Validate environment variables
const stripeConfig = validateStripeEnv();

// Initialize Stripe
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-09-30.clover',
});

console.log(`✅ Stripe initialized in ${getStripeMode()} mode`);

interface CreatePaymentIntentBody {
  amount: number;
  currency?: string;
  description?: string;
}

interface ConfirmPaymentBody {
  paymentIntentId: string;
}

interface WebhookRequest extends FastifyRequest {
  rawBody?: Buffer;
}

const stripeRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /create-payment-intent
   * Create a Stripe Payment Intent (Authenticated)
   *
   * NOTE: To complete payments, integrate Stripe.js/Elements on the frontend:
   * 1. Use the returned clientSecret with Stripe Elements
   * 2. Collect card details securely on the frontend
   * 3. Call stripe.confirmCardPayment(clientSecret, { payment_method })
   * 4. Stripe webhooks will update the payment status automatically
   */
  fastify.post<{ Body: CreatePaymentIntentBody }>(
    '/create-payment-intent',
    {
      preHandler: authenticateToken,
    },
    async (request, reply) => {
      try {
        const { amount, currency = 'USD', description } = request.body;
        const userId = request.user?.userId;

        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'User not authenticated',
          });
        }

        // Validate amount
        if (!amount || amount <= 0) {
          return reply.status(400).send({
            success: false,
            error: 'Valid amount is required',
          });
        }

        // Get user from database to verify age and consent
        const user = await User.findById(userId);
        if (!user) {
          return reply.status(404).send({
            success: false,
            error: 'User not found',
          });
        }

        const userAge = user.age;
        const parentalConsent = user.coppaConsent?.granted || false;

        // Age verification from trusted user profile
        if (userAge !== undefined) {
          // Block payments for users under 13
          if (userAge < MINIMUM_AGE_WITH_CONSENT) {
            return reply.status(403).send({
              success: false,
              error: `Payment processing is not available for users under ${MINIMUM_AGE_WITH_CONSENT} years old`,
              code: 'AGE_RESTRICTION_UNDERAGE',
              requiredAge: MINIMUM_AGE_WITH_CONSENT,
            });
          }

          // Require parental consent for 13-17
          if (userAge < MINIMUM_AGE_FOR_PAYMENTS && !parentalConsent) {
            return reply.status(403).send({
              success: false,
              error: 'Parental consent required for payment processing',
              code: 'PARENTAL_CONSENT_REQUIRED',
              requiredAge: MINIMUM_AGE_FOR_PAYMENTS,
              currentAge: userAge,
            });
          }

          // Enforce transaction limits for minors
          if (userAge < MINIMUM_AGE_FOR_PAYMENTS && amount > MAX_MINOR_TRANSACTION) {
            return reply.status(403).send({
              success: false,
              error: `Transaction amount exceeds limit for minors. Maximum: $${MAX_MINOR_TRANSACTION}`,
              code: 'MINOR_AMOUNT_LIMIT_EXCEEDED',
              maxAmount: MAX_MINOR_TRANSACTION,
            });
          }
        }

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          description: description || 'Payment',
          automatic_payment_methods: { enabled: true },
          metadata: {
            userId,
            userAge: userAge?.toString() || '',
            isMinor: (userAge && userAge < MINIMUM_AGE_FOR_PAYMENTS)?.toString() || 'false',
            parentalConsent: parentalConsent?.toString() || 'false',
          },
        });

        // Create payment record in database
        await Payment.create({
          userId,
          amount,
          currency: currency.toUpperCase(),
          status: 'pending',
          provider: 'stripe',
          providerTransactionId: paymentIntent.id,
          description,
          isMinorTransaction: userAge ? userAge < MINIMUM_AGE_FOR_PAYMENTS : false,
          ageVerified: userAge !== undefined,
          userAge,
          parentalConsent,
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
          },
        });

        return reply.send({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to create payment intent',
        });
      }
    }
  );

  /**
   * POST /confirm-payment
   * Retrieve payment status (Authenticated)
   *
   * NOTE: This endpoint checks the status of a payment intent.
   * In production, payment confirmation happens via Stripe.js on the frontend,
   * and webhooks update the database automatically.
   */
  fastify.post<{ Body: ConfirmPaymentBody }>(
    '/confirm-payment',
    {
      preHandler: authenticateToken,
    },
    async (request, reply) => {
      try {
        const { paymentIntentId } = request.body;
        const userId = request.user?.userId;

        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'User not authenticated',
          });
        }

        if (!paymentIntentId) {
          return reply.status(400).send({
            success: false,
            error: 'Payment Intent ID is required',
          });
        }

        // Retrieve the payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Map Stripe status to our status
        let status: 'pending' | 'succeeded' | 'failed' | 'cancelled' = 'pending';
        if (paymentIntent.status === 'succeeded') {
          status = 'succeeded';
        } else if (paymentIntent.status === 'canceled') {
          status = 'cancelled';
        } else if (paymentIntent.status === 'requires_payment_method' || (paymentIntent as any).last_payment_error) {
          status = 'failed';
        }

        // Update payment status in database
        const payment = await Payment.findOneAndUpdate(
          { providerTransactionId: paymentIntentId, userId },
          {
            status,
            metadata: {
              stripePaymentIntentId: paymentIntent.id,
              stripeStatus: paymentIntent.status,
              updatedAt: new Date().toISOString(),
            },
          },
          { new: true }
        );

        if (!payment) {
          return reply.status(404).send({
            success: false,
            error: 'Payment not found or does not belong to this user',
          });
        }

        return reply.send({
          success: true,
          payment: {
            id: payment._id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            createdAt: payment.createdAt,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to retrieve payment status',
        });
      }
    }
  );

  /**
   * GET /transactions
   * Get authenticated user's payment history
   */
  fastify.get<{ Querystring: { limit?: string; status?: string } }>(
    '/transactions',
    {
      preHandler: authenticateToken,
    },
    async (request, reply) => {
      try {
        const userId = request.user?.userId;

        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'User not authenticated',
          });
        }

        const { limit = '50', status } = request.query;

        const query: any = { userId };
        if (status) {
          query.status = status;
        }

        const payments = await Payment.find(query)
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .select('-metadata -__v');

        return reply.send({
          success: true,
          data: payments,
          count: payments.length,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch transactions',
        });
      }
    }
  );

  /**
   * POST /webhook
   * Handle Stripe webhooks
   *
   * IMPORTANT: For production use, configure Fastify to preserve raw request bodies
   * for webhook signature verification. Options:
   *
   * 1. Use fastify-raw-body plugin:
   *    npm install fastify-raw-body
   *    await fastify.register(require('fastify-raw-body'), {
   *      field: 'rawBody',
   *      global: false,
   *      routes: ['/api/stripe/webhook']
   *    })
   *
   * 2. Or configure specific routes with addContentTypeParser
   *
   * Without raw body access, signature verification will fail and webhooks won't work.
   * For now, this endpoint will log errors but won't process webhooks correctly.
   */
  fastify.post(
    '/webhook',
    async (request: WebhookRequest, reply: FastifyReply) => {
      try {
        const sig = request.headers['stripe-signature'] as string;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
          request.log.warn('⚠️  Stripe webhook secret not configured - set STRIPE_WEBHOOK_SECRET');
          return reply.status(400).send({ error: 'Webhook secret not configured' });
        }

        let event: Stripe.Event;

        try {
          // NOTE: This will fail without raw body handling - see documentation above
          const body = request.rawBody || JSON.stringify(request.body);
          event = stripe.webhooks.constructEvent(
            body,
            sig,
            webhookSecret
          );
        } catch (err: any) {
          request.log.error(`⚠️  Webhook signature verification failed: ${err.message}`);
          request.log.error(`   This is expected without raw body handling - see route documentation`);
          return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
        }

        // Handle the event
        switch (event.type) {
          case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            await Payment.findOneAndUpdate(
              { providerTransactionId: paymentIntent.id },
              { status: 'succeeded' }
            );
            request.log.info(`✅ Payment succeeded: ${paymentIntent.id}`);
            break;
          }

          case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            await Payment.findOneAndUpdate(
              { providerTransactionId: paymentIntent.id },
              { status: 'failed' }
            );
            request.log.info(`❌ Payment failed: ${paymentIntent.id}`);
            break;
          }

          case 'payment_intent.canceled': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            await Payment.findOneAndUpdate(
              { providerTransactionId: paymentIntent.id },
              { status: 'cancelled' }
            );
            request.log.info(`🚫 Payment cancelled: ${paymentIntent.id}`);
            break;
          }

          default:
            request.log.info(`ℹ️  Unhandled webhook event type: ${event.type}`);
        }

        return reply.send({ received: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Webhook processing failed',
        });
      }
    }
  );
};

export { stripeRoutes };