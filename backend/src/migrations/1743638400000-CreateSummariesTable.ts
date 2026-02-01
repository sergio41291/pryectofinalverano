import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSummariesTable1743638400000 implements MigrationInterface {
  name = 'CreateSummariesTable1743638400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create summaries table
    await queryRunner.createTable(
      new Table({
        name: 'summaries',
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
            name: 'sourceText',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'summaryContent',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'language',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'es'",
          },
          {
            name: 'style',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'bullet-points'",
          },
          {
            name: 'sourceFileName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sourceCharCount',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'summaryCharCount',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'minionPath',
            type: 'varchar',
            length: '255',
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
        indices: [
          {
            name: 'IDX_SUMMARIES_USER_ID',
            columnNames: ['userId'],
          },
          {
            name: 'IDX_SUMMARIES_CREATED_AT',
            columnNames: ['createdAt'],
          },
          {
            name: 'IDX_SUMMARIES_USER_CREATED',
            columnNames: ['userId', 'createdAt'],
          },
        ],
      }),
      true,
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'summaries',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('summaries');
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('summaries', foreignKey);
      }
      await queryRunner.dropTable('summaries');
    }
  }
}
