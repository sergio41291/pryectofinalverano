import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateGroupsAndMembers1743800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla groups
    await queryRunner.createTable(
      new Table({
        name: 'groups',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: false,
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

    // Crear índice en ownerId
    await queryRunner.createIndex(
      'groups',
      new TableIndex({
        name: 'IDX_GROUPS_OWNER_ID',
        columnNames: ['ownerId'],
      }),
    );

    // Foreign key a users
    await queryRunner.createForeignKey(
      'groups',
      new TableForeignKey({
        name: 'FK_GROUPS_OWNER',
        columnNames: ['ownerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Crear tabla group_members
    await queryRunner.createTable(
      new Table({
        name: 'group_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'groupId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['owner', 'admin', 'member'],
            default: "'member'",
            isNullable: false,
          },
          {
            name: 'permissions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'joinedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Índice único compuesto (un usuario solo puede estar una vez en un grupo)
    await queryRunner.createIndex(
      'group_members',
      new TableIndex({
        name: 'IDX_GROUP_MEMBERS_UNIQUE',
        columnNames: ['groupId', 'userId'],
        isUnique: true,
      }),
    );

    // Índice en groupId para queries rápidas
    await queryRunner.createIndex(
      'group_members',
      new TableIndex({
        name: 'IDX_GROUP_MEMBERS_GROUP_ID',
        columnNames: ['groupId'],
      }),
    );

    // Índice en userId para queries rápidas
    await queryRunner.createIndex(
      'group_members',
      new TableIndex({
        name: 'IDX_GROUP_MEMBERS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    // Foreign key a groups
    await queryRunner.createForeignKey(
      'group_members',
      new TableForeignKey({
        name: 'FK_GROUP_MEMBERS_GROUP',
        columnNames: ['groupId'],
        referencedTableName: 'groups',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key a users
    await queryRunner.createForeignKey(
      'group_members',
      new TableForeignKey({
        name: 'FK_GROUP_MEMBERS_USER',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys primero
    await queryRunner.dropForeignKey('group_members', 'FK_GROUP_MEMBERS_USER');
    await queryRunner.dropForeignKey('group_members', 'FK_GROUP_MEMBERS_GROUP');
    await queryRunner.dropForeignKey('groups', 'FK_GROUPS_OWNER');

    // Drop índices
    await queryRunner.dropIndex('group_members', 'IDX_GROUP_MEMBERS_USER_ID');
    await queryRunner.dropIndex('group_members', 'IDX_GROUP_MEMBERS_GROUP_ID');
    await queryRunner.dropIndex('group_members', 'IDX_GROUP_MEMBERS_UNIQUE');
    await queryRunner.dropIndex('groups', 'IDX_GROUPS_OWNER_ID');

    // Drop tablas
    await queryRunner.dropTable('group_members');
    await queryRunner.dropTable('groups');
  }
}
