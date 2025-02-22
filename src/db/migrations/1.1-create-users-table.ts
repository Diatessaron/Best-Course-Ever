import { QueryRunner } from 'typeorm';

export default async function (queryRunner: QueryRunner) {
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS users (
      _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR NOT NULL,
      password VARCHAR NOT NULL,
      name VARCHAR,
      roles TEXT[],
      courses UUID[],
      allowed_courses UUID[],
      salt VARCHAR NULL
    );
  `);

  console.log('Users table created successfully.');
}
