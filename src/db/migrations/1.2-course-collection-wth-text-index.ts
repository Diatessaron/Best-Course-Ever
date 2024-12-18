import { Db } from 'mongodb';

export default async function (database: Db) {
  const usersCollection = database.collection('courses');

  await usersCollection.createIndex(
    { name: 'text', description: 'text', tags: 'text', difficultyLevel: 'text' },
    { name: 'name_description_tags_difficultyLevel_text_index' }
  );

  console.log('Text index on "name", "description", "tags", "difficultyLevel" fields created successfully.');
};
