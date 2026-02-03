import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { StorageModule } from './modules/storage/storage.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { AudioModule } from './modules/audio/audio.module';
import { AiModule } from './modules/ai/ai.module';
import { QuestionnairesModule } from './modules/questionnaires/questionnaires.module';
import { MindMapsModule } from './modules/mind-maps/mind-maps.module';
import { GroupsModule } from './modules/groups/groups.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { TextToSpeechModule } from './modules/text-to-speech/text-to-speech.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { EmailModule } from './modules/email/email.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { Translation } from './entities/translation.entity';
import { Payment } from './entities/payment.entity';
import { Category } from './entities/category.entity';
import { DocumentShare } from './entities/document-share.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6379')),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: parseInt(configService.get('DB_PORT', '5432')),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'learpmind'),
        entities: [User, Subscription, Upload, OcrResult, AudioResult, Questionnaire, QuestionnaireResponse, QuestionnaireShare, Summary, MindMap, Group, GroupMember, Translation, Payment, Category, DocumentShare],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    StorageModule,
    UploadsModule,
    OcrModule,
    AudioModule,
    AiModule,
    QuestionnairesModule,
    MindMapsModule,
    GroupsModule,
    TranslationsModule,
    TextToSpeechModule,
    PaymentsModule,
    CategoriesModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
