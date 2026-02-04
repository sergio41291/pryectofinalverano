import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });
  const logger = new Logger('Bootstrap');

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Middleware
  app.use(helmet());
  app.use(compression());

  // CORS
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:5173', 'http://localhost:3000'];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.some(allowed => origin.includes(allowed) || allowed.includes(origin))) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 400,
    }),
  );

  // Serialization - Disabled for streaming compatibility
  // app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get('Reflector')));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('LearnMind API')
    .setDescription('Document processing with AI')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addServer(`http://localhost:${process.env.PORT || 3001}`, 'Development')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Set global route prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
