import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddGroupIdToContent1743900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar y agregar columna groupId a mind_maps si no existe
    const mindMapsTable = await queryRunner.getTable('mind_maps');
    const mindMapsHasGroupId = mindMapsTable?.findColumnByName('groupId');
    
    if (!mindMapsHasGroupId) {
      await queryRunner.addColumn(
        'mind_maps',
        new TableColumn({
          name: 'groupId',
          type: 'uuid',
          isNullable: true,
        }),
      );

      await queryRunner.createForeignKey(
        'mind_maps',
        new TableForeignKey({
          columnNames: ['groupId'],
          referencedTableName: 'groups',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          name: 'FK_mind_maps_groups',
        }),
      );
    }

    // Verificar y agregar columna groupId a summaries si no existe
    const summariesTable = await queryRunner.getTable('summaries');
    const summariesHasGroupId = summariesTable?.findColumnByName('groupId');
    
    if (!summariesHasGroupId) {
      await queryRunner.addColumn(
        'summaries',
        new TableColumn({
          name: 'groupId',
          type: 'uuid',
          isNullable: true,
        }),
      );

      await queryRunner.createForeignKey(
        'summaries',
        new TableForeignKey({
          columnNames: ['groupId'],
          referencedTableName: 'groups',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          name: 'FK_summaries_groups',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys si existen
    const mindMapsTable = await queryRunner.getTable('mind_maps');
    const mindMapsForeignKey = mindMapsTable?.foreignKeys.find(fk => fk.name === 'FK_mind_maps_groups');
    if (mindMapsForeignKey) {
      await queryRunner.dropForeignKey('mind_maps', mindMapsForeignKey);
    }

    const summariesTable = await queryRunner.getTable('summaries');
    const summariesForeignKey = summariesTable?.foreignKeys.find(fk => fk.name === 'FK_summaries_groups');
    if (summariesForeignKey) {
      await queryRunner.dropForeignKey('summaries', summariesForeignKey);
    }

    // Eliminar columnas si existen
    if (mindMapsTable?.findColumnByName('groupId')) {
      await queryRunner.dropColumn('mind_maps', 'groupId');
    }
    if (summariesTable?.findColumnByName('groupId')) {
      await queryRunner.dropColumn('summaries', 'groupId');
    }
  }
}
