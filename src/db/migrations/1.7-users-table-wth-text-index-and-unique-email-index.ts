import { QueryRunner } from 'typeorm';

export default async function (queryRunner: QueryRunner) {
  await queryRunner.query(`
    CREATE INDEX name_text_index 
    ON users USING GIN (to_tsvector('english', name));
  `);

  console.log('Text index on "name" field created successfully.');

  await queryRunner.query(`
    CREATE UNIQUE INDEX email_unique_index 
    ON users (email);
  `);

  console.log('Unique index on "email" field created successfully.');
}
