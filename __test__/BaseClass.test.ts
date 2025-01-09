import { GenericContainer, PullPolicy, StartedTestContainer } from 'testcontainers';

export class BaseTestContainer {
  private static container: StartedTestContainer;
  private static mongoUri: string;

  static async setup(): Promise<void> {
    if (!this.container) {
      const container = await new GenericContainer('mongo')
        .withExposedPorts(27017)
        .withPullPolicy(PullPolicy.alwaysPull())

      this.container = await container.start();

      this.mongoUri = `mongodb://${this.container.getHost()}:${this.container.getFirstMappedPort()}/test`;
    }
  }

  static getMongoUri(): string {
    if (!this.mongoUri) {
      throw new Error('MongoDB Testcontainer has not been set up.');
    }
    return this.mongoUri;
  }

  static async teardown(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = null;
      this.mongoUri = null;
    }
  }
}
