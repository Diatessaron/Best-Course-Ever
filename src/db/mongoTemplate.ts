import { Db, MongoClient } from 'mongodb';
import { Global, Module } from '@nestjs/common';

const uri = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/bestCourse';
const dbName = process.env.MONGO_DB_NAME || 'bestCourse';

export const MongoDBProvider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async (): Promise<Db> => {
    const client = new MongoClient(uri);
    await client.connect();
    return client.db(dbName);
  },
};

@Global()
@Module({
  providers: [MongoDBProvider],
  exports: ['DATABASE_CONNECTION'],
})
export class MongoDBModule {}