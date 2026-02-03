import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePaymentsTable1745000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para payment status
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'completed', 'failed', 'refunded')
    `);

    // Crear enum para subscription tier
    await queryRunner.query(`
      CREATE TYPE "subscription_tier_enum" AS ENUM ('free', 'pro', 'business')
    `);

    // Crear tabla payments
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'stripePaymentId',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'stripeSessionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'status',
            type: 'payment_status_enum',
            default: "'pending'",
          },
          {
            name: 'subscriptionTier',
            type: 'subscription_tier_enum',
          },
          {
            name: 'stripeCustomerId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_stripePaymentId',
        columnNames: ['stripePaymentId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Crear foreign key
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_payments_users',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('payments', 'FK_payments_users');

    // Drop índices
    await queryRunner.dropIndex('payments', 'IDX_payments_userId');
    await queryRunner.dropIndex('payments', 'IDX_payments_stripePaymentId');
    await queryRunner.dropIndex('payments', 'IDX_payments_status');
    await queryRunner.dropIndex('payments', 'IDX_payments_createdAt');

    // Drop tabla
    await queryRunner.dropTable('payments');

    // Drop enums
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "subscription_tier_enum"`);
  }
}
