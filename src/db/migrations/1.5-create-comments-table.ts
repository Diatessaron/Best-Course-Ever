import { QueryRunner } from 'typeorm';

export default async function (queryRunner: QueryRunner) {
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS comments (
      _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      target_id UUID NOT NULL,
      text TEXT NOT NULL
    );
  `);

  console.log('Comments table created successfully.');

  await queryRunner.query(`
    CREATE INDEX user_id_index 
    ON comments (user_id);
  `);

  console.log('Index on user_id created successfully.');

  await queryRunner.query(`
    CREATE INDEX target_id_index 
    ON comments (target_id);
  `);

  console.log('Index on target_id created successfully.');
}
