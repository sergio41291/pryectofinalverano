import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Payment, PaymentStatus, SubscriptionTier } from '../../entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import {
  CheckoutSessionResponseDto,
  PaymentHistoryResponseDto,
  PaymentResponseDto,
} from './dto/payment-response.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  // Precios de los planes (en centavos)
  private readonly PRICING = {
    pro: {
      amount: 999, // $9.99
      name: 'PRO Plan',
      description: '100 documentos, 5GB almacenamiento, 5 grupos',
    },
    business: {
      amount: 2999, // $29.99
      name: 'BUSINESS Plan',
      description: 'Ilimitado documentos, almacenamiento y grupos',
    },
  };

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Payments will not work.');
      // En desarrollo, usar clave de prueba si existe
      this.stripe = new Stripe(stripeSecretKey || 'sk_test_dummy', {
        apiVersion: '2023-08-16',
      });
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-08-16',
      });
      this.logger.log('Stripe initialized successfully');
    }
  }

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(
    userId: string,
    dto: CreateCheckoutDto,
  ): Promise<CheckoutSessionResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const pricing = this.PRICING[dto.tier];
      if (!pricing) {
        throw new BadRequestException('Invalid tier');
      }

      // Crear o obtener customer de Stripe
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
          },
        });
        stripeCustomerId = customer.id;
        
        // Guardar stripeCustomerId en usuario
        await this.userRepository.update(user.id, { stripeCustomerId });
      }

      // URLs de retorno
      const successUrl = dto.successUrl || `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = dto.cancelUrl || `${process.env.FRONTEND_URL}/subscription`;

      // Crear sesión de checkout
      const session = await this.stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: pricing.name,
                description: pricing.description,
              },
              unit_amount: pricing.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment', // Cambiar a 'subscription' si quieres pagos recurrentes
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
          tier: dto.tier,
        },
      });

      this.logger.log(`Checkout session created: ${session.id} for user ${userId}`);

      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (error: any) {
      this.logger.error(`Failed to create checkout session: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create checkout session');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new InternalServerErrorException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error: any) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid signature');
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as SubscriptionTier;

    if (!userId || !tier) {
      this.logger.error('Missing metadata in checkout session');
      return;
    }

    try {
      // Verificar si ya existe el pago (idempotencia)
      const existingPayment = await this.paymentRepository.findOne({
        where: { stripeSessionId: session.id },
      });

      if (existingPayment) {
        this.logger.log(`Payment already processed: ${session.id}`);
        return;
      }

      // Crear registro de pago
      const payment = this.paymentRepository.create({
        userId,
        stripePaymentId: session.payment_intent as string,
        stripeSessionId: session.id,
        amount: (session.amount_total || 0) / 100, // Convertir de centavos a dólares
        currency: (session.currency || 'usd').toUpperCase(),
        status: PaymentStatus.COMPLETED,
        subscriptionTier: tier,
        stripeCustomerId: session.customer as string,
        metadata: {
          sessionId: session.id,
          customerEmail: session.customer_email,
        },
      });

      await this.paymentRepository.save(payment);

      // Actualizar suscripción del usuario
      await this.updateUserSubscription(userId, tier);

      this.logger.log(`Payment completed for user ${userId}, tier: ${tier}`);
    } catch (error: any) {
      this.logger.error(`Failed to handle checkout completed: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle payment succeeded
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    
    // Actualizar estado del pago si existe
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.COMPLETED;
      await this.paymentRepository.save(payment);
    }
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.warn(`Payment failed: ${paymentIntent.id}`);

    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = {
        ...payment.metadata,
        failureReason: paymentIntent.last_payment_error?.message,
      };
      await this.paymentRepository.save(payment);
    }
  }

  /**
   * Update user subscription tier
   */
  private async updateUserSubscription(userId: string, tier: SubscriptionTier): Promise<void> {
    try {
      await this.userRepository.update(userId, {
        subscriptionTier: tier,
        plan: tier.toLowerCase() as 'free' | 'pro' | 'enterprise',
      });

      this.logger.log(`User ${userId} subscription updated to ${tier}`);
    } catch (error: any) {
      this.logger.error(`Failed to update user subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify payment by session ID
   */
  async verifyPayment(sessionId: string): Promise<PaymentResponseDto> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      });

      if (session.payment_status !== 'paid') {
        throw new BadRequestException('Payment not completed');
      }

      // Buscar pago existente
      let payment = await this.paymentRepository.findOne({
        where: { stripeSessionId: sessionId },
      });

      // Si no existe, crearlo ahora (el webhook puede fallar en desarrollo local)
      if (!payment) {
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier as 'pro' | 'business';

        if (!userId || !tier) {
          throw new BadRequestException('Invalid session metadata');
        }

        // Obtener usuario
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException('User not found');
        }

        // Crear registro de pago
        const paymentIntentId = typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : session.payment_intent?.id || '';
        
        payment = this.paymentRepository.create({
          userId,
          stripePaymentId: paymentIntentId,
          stripeSessionId: sessionId,
          amount: (session.amount_total || 0) / 100, // Convertir de centavos a dólares
          currency: (session.currency || 'usd').toUpperCase(),
          status: PaymentStatus.COMPLETED,
          subscriptionTier: tier as any,
          stripeCustomerId: session.customer as string,
          metadata: session.metadata || {},
        });

        await this.paymentRepository.save(payment);

        // Actualizar tier del usuario
        await this.userRepository.update(userId, {
          subscriptionTier: tier,
        });

        this.logger.log(`Payment record created from verification for session ${sessionId}`);
      }

      return this.mapToResponseDto(payment);
    } catch (error: any) {
      this.logger.error(`Failed to verify payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaymentHistoryResponseDto> {
    try {
      const [payments, total] = await this.paymentRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        payments: payments.map((p) => this.mapToResponseDto(p)),
        total,
        page,
        limit,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get payment history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cancel subscription (downgrade to free)
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Actualizar a plan gratuito
      await this.userRepository.update(userId, {
        subscriptionTier: 'free',
        plan: 'free',
      });

      this.logger.log(`Subscription cancelled for user ${userId}`);
    } catch (error: any) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get current subscription info
   */
  async getCurrentSubscription(userId: string): Promise<{
    tier: string;
    isActive: boolean;
    lastPayment?: PaymentResponseDto;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const lastPayment = await this.paymentRepository.findOne({
      where: { userId, status: PaymentStatus.COMPLETED },
      order: { createdAt: 'DESC' },
    });

    return {
      tier: user.subscriptionTier,
      isActive: user.subscriptionTier !== 'free',
      lastPayment: lastPayment ? this.mapToResponseDto(lastPayment) : undefined,
    };
  }

  /**
   * Map Payment entity to DTO
   */
  private mapToResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      userId: payment.userId,
      stripePaymentId: payment.stripePaymentId,
      amount: parseFloat(payment.amount.toString()),
      currency: payment.currency,
      status: payment.status,
      subscriptionTier: payment.subscriptionTier,
      createdAt: payment.createdAt,
    };
  }
}
