import { QueryRunner } from 'typeorm';

export default async function (queryRunner: QueryRunner) {
  await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS surveys
      (
          _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type      varchar(255),
          user_id   UUID,
          target_id UUID,
          rank      INTEGER CHECK (rank >= 1 AND rank <= 5)
      );
  `);

  console.log('Surveys table created successfully.');

  await queryRunner.query(`
    ALTER TABLE surveys 
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) 
    REFERENCES users(_id) ON DELETE CASCADE;
`);

  console.log('Foreign key on user_id created successfully.');
}
