import { QueryRunner } from 'typeorm';

export default async function (queryRunner: QueryRunner) {
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS lectures (
      _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255),
      description TEXT,
      files JSONB
    );
  `);

  console.log('Lectures table created successfully.');
}
