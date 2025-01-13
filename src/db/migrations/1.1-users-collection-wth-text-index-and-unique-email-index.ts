import { Db } from 'mongodb';

export default async function (database: Db) {
  const usersCollection = database.collection('users');

  await usersCollection.createIndex(
    { name: 'text' },
    { name: 'name_text_index' }
  );

  console.log('Text index on "name" field created successfully.');

  await usersCollection.createIndex(
    { email: 1 },
    { unique: true }
  )

  console.log('Unique index on "email" field created successfully.');
};
