import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddCascadeDeleteToOcrResults1706530800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists first
    const tableExists = await queryRunner.hasTable('ocr_results');
    if (!tableExists) {
      console.log('Table ocr_results does not exist yet, skipping cascade delete migration');
      return;
    }

    // Check if foreign key exists
    const table = await queryRunner.getTable('ocr_results');
    const foreignKey = table?.foreignKeys.find(fk => fk.name === 'FK_48c874c228bf5a5a4e0ca0f5a49');
    
    if (!foreignKey) {
      console.log('Foreign key FK_48c874c228bf5a5a4e0ca0f5a49 does not exist, skipping');
      return;
    }

    // Drop existing foreign key constraint
    await queryRunner.dropForeignKey('ocr_results', 'FK_48c874c228bf5a5a4e0ca0f5a49');

    // Create new foreign key with CASCADE delete
    await queryRunner.createForeignKey(
      'ocr_results',
      new TableForeignKey({
        columnNames: ['uploadId'],
        referencedTableName: 'uploads',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        name: 'FK_48c874c228bf5a5a4e0ca0f5a49',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('ocr_results');
    if (!tableExists) {
      return;
    }

    // Revert to original foreign key without CASCADE
    await queryRunner.dropForeignKey('ocr_results', 'FK_48c874c228bf5a5a4e0ca0f5a49');

    await queryRunner.createForeignKey(
      'ocr_results',
      new TableForeignKey({
        columnNames: ['uploadId'],
        referencedTableName: 'uploads',
        referencedColumnNames: ['id'],
        name: 'FK_48c874c228bf5a5a4e0ca0f5a49',
      }),
    );
  }
}
