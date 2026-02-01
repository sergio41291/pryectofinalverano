import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMindMapsTable1743700000000 implements MigrationInterface {
  name = 'CreateMindMapsTable1743700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create mind_maps table
    await queryRunner.createTable(
      new Table({
        name: 'mind_maps',
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
            name: 'structure',
            type: 'jsonb',
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
            name: 'sourceCharCount',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'nodeCount',
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

    // Create indexes
    await queryRunner.createIndex(
      'mind_maps',
      new TableIndex({
        name: 'IDX_MIND_MAPS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'mind_maps',
      new TableIndex({
        name: 'IDX_MIND_MAPS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'mind_maps',
      new TableIndex({
        name: 'IDX_MIND_MAPS_USER_CREATED',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'mind_maps',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_MIND_MAPS_USER',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('mind_maps');
    if (table) {
      // Drop foreign key
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('mind_maps', foreignKey);
      }

      // Drop indexes
      await queryRunner.dropIndex('mind_maps', 'IDX_MIND_MAPS_USER_CREATED');
      await queryRunner.dropIndex('mind_maps', 'IDX_MIND_MAPS_CREATED_AT');
      await queryRunner.dropIndex('mind_maps', 'IDX_MIND_MAPS_USER_ID');

      // Drop table
      await queryRunner.dropTable('mind_maps');
    }
  }
}
