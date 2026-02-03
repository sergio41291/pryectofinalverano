import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategories1738602000000 implements MigrationInterface {
  name = 'AddCategories1738602000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla categories
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "color" character varying(7) NOT NULL DEFAULT '#6366f1',
        "icon" character varying(50),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    // Agregar FK a users
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD CONSTRAINT "FK_categories_userId" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    // Agregar categoryId a uploads
    await queryRunner.query(`
      ALTER TABLE "uploads" 
      ADD COLUMN "categoryId" uuid
    `);

    // Agregar FK de uploads a categories
    await queryRunner.query(`
      ALTER TABLE "uploads" 
      ADD CONSTRAINT "FK_uploads_categoryId" 
      FOREIGN KEY ("categoryId") 
      REFERENCES "categories"("id") 
      ON DELETE SET NULL
    `);

    // Crear índice para búsquedas por categoryId
    await queryRunner.query(`
      CREATE INDEX "IDX_uploads_categoryId" 
      ON "uploads" ("categoryId")
    `);

    // Crear índices para búsqueda full-text
    await queryRunner.query(`
      CREATE INDEX "IDX_uploads_fileName_trgm" 
      ON "uploads" 
      USING gin (to_tsvector('spanish', "fileName"))
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_uploads_extractedText_trgm" 
      ON "uploads" 
      USING gin (to_tsvector('spanish', COALESCE("extractedText", '')))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_uploads_extractedText_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_uploads_fileName_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_uploads_categoryId"`);

    // Eliminar FK y columna categoryId
    await queryRunner.query(`ALTER TABLE "uploads" DROP CONSTRAINT IF EXISTS "FK_uploads_categoryId"`);
    await queryRunner.query(`ALTER TABLE "uploads" DROP COLUMN IF EXISTS "categoryId"`);

    // Eliminar FK de categories
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_userId"`);

    // Eliminar tabla categories
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
