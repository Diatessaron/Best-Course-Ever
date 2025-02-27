import { QueryRunner } from 'typeorm';

export default async function (queryRunner: QueryRunner) {
  await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
  await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);

  await queryRunner.query(`
      ALTER TABLE courses
          ADD COLUMN search_vector tsvector;
  `);

  await queryRunner.query(`
      CREATE FUNCTION update_courses_search_vector() RETURNS TRIGGER AS $$
      BEGIN
          NEW.search_vector := 
              setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
              setweight(to_tsvector('english', 
                CASE 
                    WHEN NEW.tags IS NULL OR NEW.tags = '' THEN ''
                    ELSE array_to_string(string_to_array(NEW.tags, ','), ' ')
                END
            ), 'C') ||
              setweight(to_tsvector('english', coalesce(NEW.difficulty_level::text, '')), 'D');
          RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
  `);

  await queryRunner.query(`
      CREATE TRIGGER trigger_update_courses_search_vector
      BEFORE INSERT OR UPDATE ON courses
      FOR EACH ROW EXECUTE FUNCTION update_courses_search_vector();
  `);

  await queryRunner.query(`
      CREATE INDEX name_description_tags_difficultyLevel_text_index
      ON courses USING GIN (search_vector);
  `);

  console.log(
    'Text index on "name", "description", "tags", "difficultyLevel" fields created successfully.',
  );
}
