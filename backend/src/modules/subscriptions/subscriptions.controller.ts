import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  async getCurrentSubscription(@Param('userId') userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }

  @Post('upgrade/:plan')
  async upgrade(@Param('userId') userId: string, @Param('plan') plan: 'pro' | 'enterprise') {
    return this.subscriptionsService.upgrade(userId, plan);
  }

  @Post('downgrade/:plan')
  async downgrade(@Param('userId') userId: string, @Param('plan') plan: 'free' | 'pro') {
    return this.subscriptionsService.downgrade(userId, plan);
  }
}
