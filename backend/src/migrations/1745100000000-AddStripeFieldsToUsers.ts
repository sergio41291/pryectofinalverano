import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStripeFieldsToUsers1745100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar stripeCustomerId
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'stripeCustomerId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Agregar subscriptionTier (con enum)
    await queryRunner.query(`
      CREATE TYPE "user_subscription_tier_enum" AS ENUM ('free', 'pro', 'business')
    `);

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'subscriptionTier',
        type: 'user_subscription_tier_enum',
        default: "'free'",
      }),
    );

    // Crear índice para búsquedas rápidas por stripeCustomerId
    await queryRunner.query(`
      CREATE INDEX "IDX_users_stripeCustomerId" ON "users" ("stripeCustomerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop índice
    await queryRunner.query(`DROP INDEX "IDX_users_stripeCustomerId"`);

    // Drop column subscriptionTier
    await queryRunner.dropColumn('users', 'subscriptionTier');

    // Drop enum
    await queryRunner.query(`DROP TYPE "user_subscription_tier_enum"`);

    // Drop column stripeCustomerId
    await queryRunner.dropColumn('users', 'stripeCustomerId');
  }
}
