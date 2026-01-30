import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAudioSummaryAndStoragePaths1740000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar campos a audio_results tabla
    await queryRunner.addColumn(
      'audio_results',
      new TableColumn({
        name: 'summary',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'audio_results',
      new TableColumn({
        name: 'transcriptionMinioPath',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'audio_results',
      new TableColumn({
        name: 'summaryMinioPath',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'audio_results',
      new TableColumn({
        name: 'audioMinioPath',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Agregar campo summary a uploads tabla
    await queryRunner.addColumn(
      'uploads',
      new TableColumn({
        name: 'summary',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover campos de audio_results tabla
    await queryRunner.dropColumn('audio_results', 'audioMinioPath');
    await queryRunner.dropColumn('audio_results', 'summaryMinioPath');
    await queryRunner.dropColumn('audio_results', 'transcriptionMinioPath');
    await queryRunner.dropColumn('audio_results', 'summary');

    // Remover campo de uploads tabla
    await queryRunner.dropColumn('uploads', 'summary');
  }
}
