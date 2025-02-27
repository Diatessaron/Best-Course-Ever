import { QueryRunner } from 'typeorm';

export default async function (queryRunner: QueryRunner) {
  await queryRunner.query(`
    CREATE UNIQUE INDEX token_unique_index 
    ON blacklisted_tokens (token);
  `);

  await queryRunner.query(`
    CREATE INDEX expires_at_index 
    ON blacklisted_tokens (expires_at);
  `);

  await queryRunner.query(`
    CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      DELETE FROM blacklisted_tokens
      WHERE expires_at <= CURRENT_TIMESTAMP;
    END;
    $$;
  `);

  console.log(
    'Indexes and cleanup job for "blacklisted_tokens" table created successfully',
  );
}
