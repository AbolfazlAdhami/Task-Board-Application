import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefreshTokenFamilyIndex1791715401364 implements MigrationInterface {
  name = 'RefreshTokenFamilyIndex1791715401364';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_family_id"
      ON "refresh_tokens" ("family_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_refresh_tokens_family_id"
    `);
  }
}
