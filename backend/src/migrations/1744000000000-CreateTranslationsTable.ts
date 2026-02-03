import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTranslationsTable1744000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'translations',
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
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'originalText',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'translatedText',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'sourceLanguage',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'targetLanguage',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'sourceFileName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'originalCharCount',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'translatedCharCount',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key to users
    await queryRunner.createForeignKey(
      'translations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_translations_users',
      }),
    );

    // Index on userId for faster queries
    await queryRunner.createIndex(
      'translations',
      new TableIndex({
        name: 'IDX_translations_userId',
        columnNames: ['userId'],
      }),
    );

    // Index on createdAt for sorting
    await queryRunner.createIndex(
      'translations',
      new TableIndex({
        name: 'IDX_translations_createdAt',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('translations', 'IDX_translations_createdAt');
    await queryRunner.dropIndex('translations', 'IDX_translations_userId');
    await queryRunner.dropForeignKey('translations', 'FK_translations_users');
    await queryRunner.dropTable('translations');
  }
}
