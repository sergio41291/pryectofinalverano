import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { Subscription } from './modules/subscriptions/entities/subscription.entity';
import { Upload } from './modules/uploads/entities/upload.entity';
import { OcrResult } from './modules/ocr/entities/ocr-result.entity';
import { AudioResult } from './modules/audio/entities/audio-result.entity';
import { Questionnaire } from './entities/questionnaire.entity';
import { QuestionnaireResponse } from './entities/questionnaire-response.entity';
import { QuestionnaireShare } from './entities/questionnaire-share.entity';
import { Summary } from './entities/summary.entity';
import { MindMap } from './entities/mind-map.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'learpmind',
  entities: [
    User,
    Subscription,
    Upload,
    OcrResult,
    AudioResult,
    Questionnaire,
    QuestionnaireResponse,
    QuestionnaireShare,
    Summary,
    MindMap,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});
