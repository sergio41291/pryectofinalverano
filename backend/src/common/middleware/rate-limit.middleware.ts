import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private store: RateLimitStore = {};
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly maxRequests = 100; // requests per window

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!this.store[key]) {
      this.store[key] = { count: 1, resetTime: now + this.windowMs };
    } else if (now > this.store[key].resetTime) {
      this.store[key] = { count: 1, resetTime: now + this.windowMs };
    } else {
      this.store[key].count++;
    }

    const remaining = Math.max(0, this.maxRequests - this.store[key].count);
    const resetTime = this.store[key].resetTime;

    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (this.store[key].count > this.maxRequests) {
      this.logger.warn(`Rate limit exceeded for IP: ${key}`);
      throw new HttpException('Too many requests, please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }

  // Cleanup old entries every 30 minutes
  private cleanupStore() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (now > this.store[key].resetTime + this.windowMs) {
        delete this.store[key];
      }
    });
  }
}
