import { Injectable, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { readdirSync } from 'fs';
import { MigrationDocument } from './migrationDocument';
import * as process from 'node:process';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MigrationService implements OnModuleInit {
  private migrationsDir = join(__dirname, 'migrations');

  constructor(
    @InjectRepository(MigrationDocument)
    private readonly migrationRepository: Repository<MigrationDocument>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.runMigrations();
  }

  async runMigrations() {
    console.log('Starting migrations...');

    const migrationFiles = readdirSync(this.migrationsDir).filter((file) =>
      file.endsWith(
        process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'dev'
          ? '.js'
          : '.ts',
      ),
    );

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
    const migrations = await this.migrationRepository.find();
    return migrations.map((doc) => doc.name);
  }

  private async executeMigration(fileName: string) {
    console.log(`Executing migration: ${fileName}`);
    const migrationPath = join(this.migrationsDir, fileName);

    const { default: migrationFunction } = await import(migrationPath);

    if (typeof migrationFunction !== 'function') {
      console.log('function - ' + migrationFunction);
      console.log('path - ' + migrationPath);
      throw new Error(
        `Migration file ${fileName} does not export a default function.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await migrationFunction(queryRunner);
      await this.recordMigration(fileName);
      await queryRunner.commitTransaction();
      console.log(`Migration ${fileName} executed successfully.`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`Error executing migration ${fileName}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async recordMigration(fileName: string) {
    const migration = this.migrationRepository.create({
      name: fileName,
      executedAt: new Date(),
    });
    await this.migrationRepository.save(migration);
  }
}
