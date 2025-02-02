import { Collection, Db } from 'mongodb';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { readdirSync } from 'fs';
import { MigrationDocument } from './migrationDocument';
import * as process from 'node:process';

@Injectable()
export class MigrationService implements OnModuleInit {
  private migrationsDir = join(__dirname, 'migrations');
  private database: Db;
  private migrationCollection: Collection<MigrationDocument>;

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Db
  ) {
    this.database = db;
    this.migrationCollection = db.collection('migrations');
  }

  async onModuleInit() {
    await this.runMigrations();
  }

  async runMigrations() {
    console.log('Starting migrations...');

    const migrationFiles = readdirSync(this.migrationsDir).filter((file) => file.endsWith(
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'dev' ? '.js' : '.ts'
    ));

    const executedMigrations = await this.getExecutedMigrations();

    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        await this.executeMigration(file);
      } else {
        console.log(`Migration ${file} already executed. Skipping.`);
      }
    }

    console.log('Migrations completed.');
  }

  private async getExecutedMigrations(): Promise<string[]> {
    const migrations = await this.migrationCollection.find().toArray();
    return migrations.map((doc) => doc.name);
  }

  private async executeMigration(fileName: string) {
    console.log(`Executing migration: ${fileName}`);
    const migrationPath = join(this.migrationsDir, fileName);

    const { default: migrationFunction } = await import(migrationPath);

    if (typeof migrationFunction !== 'function') {
      console.log('function - ' + migrationFunction);
      console.log('path - ' + migrationPath);
      throw new Error(`Migration file ${fileName} does not export a default function.`);
    }

    try {
      await migrationFunction(this.database);
      await this.recordMigration(fileName);
      console.log(`Migration ${fileName} executed successfully.`);
    } catch (error) {
      console.error(`Error executing migration ${fileName}:`, error);
      throw error;
    }
  }

  private async recordMigration(fileName: string) {
    await this.migrationCollection.insertOne({
      name: fileName,
      executedAt: new Date(),
    });
  }
}
