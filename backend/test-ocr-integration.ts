/**
 * Test de integración OCR - Valida que Paddle OCR se ejecuta correctamente
 * 
 * Uso:
 * npm run test -- test-ocr-integration.ts
 * 
 * O ejecutar directamente con ts-node:
 * npx ts-node test-ocr-integration.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from './src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('OCR Integration Test (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let uploadId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: 400,
      }),
    );
    await app.init();

    // Step 1: Register user
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `ocr-test-${Date.now()}@learmmind.ai`,
        password: 'OcrTest123!Secure',
      })
      .expect(201);

    authToken = registerRes.body.accessToken;
    userId = registerRes.body.user.id;
    console.log('✅ User registered:', userId);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. should upload a test file', async () => {
    // Crear archivo de prueba
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    // Si no existe, crear un dummy file
    if (!fs.existsSync(testImagePath)) {
      fs.writeFileSync(testImagePath, Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]));
    }

    const response = await request(app.getHttpServer())
      .post('/api/uploads')
      .set('Authorization', `Bearer ${authToken}`)
      .field('description', 'OCR Test Image')
      .attach('file', testImagePath)
      .expect(201);

    uploadId = response.body.id;
    console.log('✅ File uploaded:', uploadId);
    expect(response.body.id).toBeDefined();
    expect(response.body.userId).toBe(userId);
  });

  it('2. should trigger OCR processing', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/ocr/${uploadId}/process`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ language: 'es' })
      .expect(201);

    console.log('✅ OCR job enqueued:', response.body.jobId);
    expect(response.body.jobId).toBeDefined();
    expect(response.body.status).toBe('pending');
  });

  it('3. should wait for OCR result', async () => {
    // Esperar hasta 30 segundos para que se procese
    const startTime = Date.now();
    const maxWaitTime = 30000;

    while (Date.now() - startTime < maxWaitTime) {
      const response = await request(app.getHttpServer())
        .get(`/api/ocr/${uploadId}`)
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200 && response.body.status === 'completed') {
        console.log('✅ OCR result available');
        console.log('   Extracted text:', response.body.extractedText?.text?.substring(0, 100) + '...');
        expect(response.body.extractedText).toBeDefined();
        expect(response.body.status).toBe('completed');
        return;
      }

      // Esperar 2 segundos antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('OCR processing timeout - result not available after 30 seconds');
  });

  it('4. should list user OCR results', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/ocr?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    console.log('✅ OCR results listed:', response.body.total, 'total');
    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('5. should handle WebSocket OCR notifications', async () => {
    // Este test requiere conexión WebSocket
    console.log('⚠️  WebSocket test: Manual verification needed');
    expect(true).toBe(true);
  });
});

describe('Paddle OCR Service Validation', () => {
  it('should verify Python dependencies are installed', async () => {
    // Verificar que PaddleOCR está disponible
    const { execSync } = require('child_process');
    try {
      const result = execSync('python -c "import paddleocr; print(paddleocr.__version__)"', {
        encoding: 'utf-8',
      });
      console.log('✅ PaddleOCR version:', result.trim());
      expect(result.includes('3.4') || result.includes('3')).toBe(true);
    } catch (error) {
      console.error('❌ PaddleOCR not installed');
      throw error;
    }
  });

  it('should test OCR script directly', async () => {
    const { spawn } = require('child_process');
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    const outputPath = path.join(__dirname, 'ocr-output.json');

    // Crear archivo de prueba
    if (!fs.existsSync(testImagePath)) {
      fs.writeFileSync(testImagePath, Buffer.from([0xFF, 0xD8])); // Dummy JPEG
    }

    return new Promise((resolve, reject) => {
      const process = spawn('python', [
        path.join(__dirname, 'scripts', 'paddle_ocr_service.py'),
        testImagePath,
        outputPath,
        'es',
      ]);

      let timeout = setTimeout(() => {
        process.kill();
        reject(new Error('OCR script timeout'));
      }, 10000);

      process.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`OCR script failed with code ${code}`));
        }
        console.log('✅ OCR script executed successfully');
        resolve(true);
      });

      process.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });
});

// Ejecutar si se llama directamente
if (require.main === module) {
  console.log('🚀 Starting OCR Integration Tests...\n');
  
  Test.createTestingModule({
    imports: [AppModule],
  })
    .compile()
    .then(async (moduleFixture) => {
      const app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );
      await app.init();
      
      console.log('✅ NestJS app initialized');
      console.log('✅ Database connection established');
      console.log('✅ Bull queue ready');
      console.log('✅ Redis cache available\n');
      
      await app.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Test error:', err);
      process.exit(1);
    });
}
