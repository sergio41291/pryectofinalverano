export class PaymentResponseDto {
  id: string;
  userId: string;
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: string;
  subscriptionTier: string;
  createdAt: Date;
}

export class CheckoutSessionResponseDto {
  sessionId: string;
  url: string;
}

export class PaymentHistoryResponseDto {
  payments: PaymentResponseDto[];
  total: number;
  page: number;
  limit: number;
}
