import { QueryRunner } from 'typeorm';

export default async function (queryRunner: QueryRunner) {
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS courses (
      _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR,
      description TEXT,
      tags TEXT[],
      difficulty_level INTEGER,
      lectures UUID[]
    );
  `);

  console.log('Courses table created successfully.');
}
