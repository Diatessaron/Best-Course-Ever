import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { PullPolicy } from 'testcontainers';

export class BaseTestContainer {
  private static container: StartedPostgreSqlContainer;
  private static postgresUri: string;

  static async setup(): Promise<void> {
    if (!this.container) {
      const container = new PostgreSqlContainer()
        .withExposedPorts(5432)
        .withDatabase('test')
        .withUsername('test')
        .withPassword('test')
        .withPullPolicy(PullPolicy.alwaysPull());

      this.container = await container.start();

      this.postgresUri = `postgresql://${this.container.getUsername()}:${this.container.getPassword()}@${this.container.getHost()}:${this.container.getFirstMappedPort()}/${this.container.getDatabase()}`;
    }
  }

  static getDatabaseUri(): string {
    if (!this.postgresUri) {
      throw new Error('PostgreSQL Testcontainer has not been set up.');
    }
    return this.postgresUri;
  }

  static async teardown(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = null;
      this.postgresUri = null;
    }
  }
}
