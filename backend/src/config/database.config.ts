import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Subscription } from '../modules/subscriptions/entities/subscription.entity';
import { Upload } from '../modules/uploads/entities/upload.entity';

class SilentLogger {
  logQuery(query: string) {
    // Silent - no logs
  }

  logQueryError(error: string, query: string) {
    // Only log errors if needed, but suppress for now
  }

  logQuerySlow(time: number, query: string) {
    // Silent
  }

  logSchemaBuild(message: string) {
    // Silent
  }

  logMigration(message: string) {
    // Silent
  }

  log(level: string, message: any) {
    // Silent
  }
}

export function databaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'learpmind',
    entities: [User, Subscription, Upload],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: false,
    logger: new SilentLogger(),
  };
}
