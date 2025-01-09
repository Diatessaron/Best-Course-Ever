import { Db } from 'mongodb';

export default async function (database: Db) {
  const usersCollection = database.collection('blacklistedTokens');

  await usersCollection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  );

  await usersCollection.createIndex(
    { token: 1 },
    { unique: true }
  );

  console.log('TTL index for "blacklistedTokens" collection created');
};
