import { MigrationInterface, QueryRunner } from 'typeorm';

export class TodoRichContent1791757930426 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "todo_status_enum" AS ENUM ('todo', 'in_progress', 'done')`,
    );
    await queryRunner.query(
      `CREATE TYPE "todo_priority_enum" AS ENUM ('low', 'medium', 'high')`,
    );

    await queryRunner.query(`
      ALTER TABLE "todos"
        ADD COLUMN "status" "todo_status_enum" NOT NULL DEFAULT 'todo',
        ADD COLUMN "priority" "todo_priority_enum" NOT NULL DEFAULT 'medium',
        ADD COLUMN "due_date" date
    `);

    await queryRunner.query(`
      UPDATE "todos"
      SET "status" = 'done'
      WHERE "is_completed" = true
    `);

    await queryRunner.query(`
      ALTER TABLE "todos"
      ALTER COLUMN "description" TYPE jsonb
      USING CASE
        WHEN "description" IS NULL OR btrim("description") = ''
          THEN '{"type":"doc","content":[]}'::jsonb
        ELSE jsonb_build_object(
          'type', 'doc',
          'content', jsonb_build_array(
            jsonb_build_object(
              'type', 'paragraph',
              'content', jsonb_build_array(
                jsonb_build_object('type', 'text', 'text', "description")
              )
            )
          )
        )
      END
    `);

    await queryRunner.query(`ALTER TABLE "todos" DROP COLUMN "is_completed"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "todos"
      ADD COLUMN "is_completed" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      UPDATE "todos" SET "is_completed" = ("status" = 'done')
    `);
    await queryRunner.query(`
      ALTER TABLE "todos"
      ALTER COLUMN "description" TYPE text
      USING "description"::text
    `);
    await queryRunner.query(`
      ALTER TABLE "todos"
        DROP COLUMN "due_date",
        DROP COLUMN "priority",
        DROP COLUMN "status"
    `);

    await queryRunner.query(`DROP TYPE "todo_priority_enum"`);
    await queryRunner.query(`DROP TYPE "todo_status_enum"`);
  }
}
