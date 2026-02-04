import axios from 'axios';
import { getApiUrl } from '../config/api';

const API_URL = getApiUrl();

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface Payment {
  id: string;
  userId: string;
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  subscriptionTier: 'free' | 'pro' | 'business';
  createdAt: string;
}

export interface PaymentHistoryResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Subscription {
  tier: 'free' | 'pro' | 'business';
  stripeCustomerId?: string;
  isActive: boolean;
}

class PaymentService {
  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getAuthHeaders() {
    const token = this.getToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a Stripe checkout session
   */
  async createCheckoutSession(tier: 'PRO' | 'BUSINESS', successUrl: string, cancelUrl: string): Promise<CheckoutSessionResponse> {
    try {
      const response = await axios.post<CheckoutSessionResponse>(
        `${API_URL}/payments/create-checkout`,
        {
          tier: tier.toLowerCase(), // Backend expects lowercase
          successUrl,
          cancelUrl,
        },
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating checkout session:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al crear sesión de pago');
    }
  }

  /**
   * Verify payment by session ID
   */
  async verifyPayment(sessionId: string): Promise<Payment> {
    try {
      const response = await axios.get<Payment>(
        `${API_URL}/payments/verify/${sessionId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error verifying payment:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al verificar pago');
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(page: number = 1, limit: number = 10): Promise<PaymentHistoryResponse> {
    try {
      const response = await axios.get<PaymentHistoryResponse>(
        `${API_URL}/payments/history`,
        {
          params: { page, limit },
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment history:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al obtener historial de pagos');
    }
  }

  /**
   * Get current subscription
   */
  async getCurrentSubscription(): Promise<Subscription> {
    try {
      const response = await axios.get<Subscription>(
        `${API_URL}/payments/subscription`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching subscription:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al obtener suscripción');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/payments/cancel`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );
    } catch (error: any) {
      console.error('Error canceling subscription:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al cancelar suscripción');
    }
  }
}

export const paymentService = new PaymentService();
