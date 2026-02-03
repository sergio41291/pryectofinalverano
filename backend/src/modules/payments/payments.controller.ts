import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create Stripe checkout session
   */
  @Post('create-checkout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createCheckout(@GetUser('id') userId: string, @Body() dto: CreateCheckoutDto) {
    this.logger.log(`Creating checkout for user ${userId}, tier: ${dto.tier}`);
    return this.paymentsService.createCheckoutSession(userId, dto);
  }

  /**
   * Stripe webhook endpoint (NO AUTH - Stripe lo llama)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    this.logger.log('Received Stripe webhook');
    
    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.error('No raw body in webhook request');
      throw new Error('No raw body');
    }

    await this.paymentsService.handleWebhook(signature, rawBody);
    
    return { received: true };
  }

  /**
   * Verify payment by session ID
   */
  @Get('verify/:sessionId')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Param('sessionId') sessionId: string) {
    this.logger.log(`Verifying payment session: ${sessionId}`);
    return this.paymentsService.verifyPayment(sessionId);
  }

  /**
   * Get payment history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(
    @GetUser('id') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.paymentsService.getPaymentHistory(
      userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  /**
   * Cancel subscription
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@GetUser('id') userId: string) {
    this.logger.log(`Cancelling subscription for user ${userId}`);
    await this.paymentsService.cancelSubscription(userId);
    return { message: 'Subscription cancelled successfully' };
  }

  /**
   * Get current subscription info
   */
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@GetUser('id') userId: string) {
    return this.paymentsService.getCurrentSubscription(userId);
  }
}
