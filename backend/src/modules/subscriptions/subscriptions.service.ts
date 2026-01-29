import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';

export const PLAN_CONFIG = {
  free: {
    monthlyPrice: 0,
    documentLimit: 10,
    storageLimit: 100 * 1024 * 1024, // 100MB
  },
  pro: {
    monthlyPrice: 29.99,
    documentLimit: 100,
    storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
  },
  enterprise: {
    monthlyPrice: 99.99,
    documentLimit: 1000,
    storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
  },
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
  ) {}

  async create(userId: string, plan: 'free' | 'pro' | 'enterprise'): Promise<Subscription> {
    const config = PLAN_CONFIG[plan];

    const subscription = this.subscriptionsRepository.create({
      userId,
      plan,
      monthlyPrice: config.monthlyPrice,
      documentLimit: config.documentLimit,
      storageLimit: config.storageLimit,
      status: 'active',
      startDate: new Date(),
      autoRenew: true,
    });

    return this.subscriptionsRepository.save(subscription);
  }

  async findByUserId(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription for user ${userId} not found`);
    }

    return subscription;
  }

  async upgrade(userId: string, newPlan: 'pro' | 'enterprise'): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);
    const config = PLAN_CONFIG[newPlan];

    subscription.plan = newPlan;
    subscription.monthlyPrice = config.monthlyPrice;
    subscription.documentLimit = config.documentLimit;
    subscription.storageLimit = config.storageLimit;

    return this.subscriptionsRepository.save(subscription);
  }

  async downgrade(userId: string, newPlan: 'free' | 'pro'): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);
    const config = PLAN_CONFIG[newPlan];

    subscription.plan = newPlan;
    subscription.monthlyPrice = config.monthlyPrice;
    subscription.documentLimit = config.documentLimit;
    subscription.storageLimit = config.storageLimit;

    return this.subscriptionsRepository.save(subscription);
  }

  async cancel(userId: string): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);
    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    return this.subscriptionsRepository.save(subscription);
  }

  async updateUsage(subscriptionId: string, documentSize: number): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    subscription.documentUsage += 1;
    subscription.storageUsage += documentSize;

    return this.subscriptionsRepository.save(subscription);
  }
}
