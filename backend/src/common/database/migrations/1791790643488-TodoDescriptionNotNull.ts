import { MigrationInterface, QueryRunner } from "typeorm";

export class TodoDescriptionNotNull1791790643488 implements MigrationInterface {
    name = 'TodoDescriptionNotNull1791790643488'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "description" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "description" SET DEFAULT '{ "type": "doc", "content": [] }'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "description" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "todos" ALTER COLUMN "description" DROP NOT NULL`);
    }

}
