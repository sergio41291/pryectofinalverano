import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateDocumentShares1738604000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla document_shares
    await queryRunner.createTable(
      new Table({
        name: 'document_shares',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'uploadId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sharedByUserId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sharedWithUserId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'permission',
            type: 'enum',
            enum: ['view', 'edit'],
            default: "'view'",
            isNullable: false,
          },
          {
            name: 'sharedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Índice único para evitar compartir el mismo documento dos veces al mismo usuario
    await queryRunner.createIndex(
      'document_shares',
      new TableIndex({
        name: 'IDX_DOCUMENT_SHARES_UPLOAD_USER',
        columnNames: ['uploadId', 'sharedWithUserId'],
        isUnique: true,
      }),
    );

    // Índice en sharedByUserId
    await queryRunner.createIndex(
      'document_shares',
      new TableIndex({
        name: 'IDX_DOCUMENT_SHARES_SHARED_BY',
        columnNames: ['sharedByUserId'],
      }),
    );

    // Índice en sharedWithUserId
    await queryRunner.createIndex(
      'document_shares',
      new TableIndex({
        name: 'IDX_DOCUMENT_SHARES_SHARED_WITH',
        columnNames: ['sharedWithUserId'],
      }),
    );

    // Foreign key a uploads
    await queryRunner.createForeignKey(
      'document_shares',
      new TableForeignKey({
        name: 'FK_DOCUMENT_SHARES_UPLOAD',
        columnNames: ['uploadId'],
        referencedTableName: 'uploads',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key a users (sharedBy)
    await queryRunner.createForeignKey(
      'document_shares',
      new TableForeignKey({
        name: 'FK_DOCUMENT_SHARES_SHARED_BY',
        columnNames: ['sharedByUserId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key a users (sharedWith)
    await queryRunner.createForeignKey(
      'document_shares',
      new TableForeignKey({
        name: 'FK_DOCUMENT_SHARES_SHARED_WITH',
        columnNames: ['sharedWithUserId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('document_shares');
  }
}
