import { QueryRunner } from 'typeorm';

export default async function (queryRunner: QueryRunner) {
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS blacklisted_tokens (
      token VARCHAR(255) PRIMARY KEY,
      expires_at TIMESTAMP NOT NULL
    );
  `);

  console.log('Blacklisted tokens table created successfully.');
}
