import { DataSource } from 'typeorm';
import { Inject } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';

export function Transactional() {
  const dataSourceInjector = Inject(getDataSourceToken());

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    dataSourceInjector(target, 'dataSource');

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const dataSource = (this as any).dataSource as DataSource;

      if (!dataSource) {
        throw new Error(
          'DataSource is not injected. Make sure your class is properly decorated with @Injectable()',
        );
      }

      return await dataSource.transaction(async (entityManager) => {
        const originalRepositories = new Map();

        for (const [key, value] of Object.entries(this)) {
          if (
            typeof value === 'object' &&
            value !== null &&
            value?.constructor?.name === 'Repository' &&
            'target' in value
          ) {
            originalRepositories.set(key, value);
            this[key] = entityManager.getRepository((value as any).target);
          }
        }

        try {
          return await originalMethod.apply(this, args);
        } finally {
          for (const [key, value] of originalRepositories.entries()) {
            this[key] = value;
          }
        }
      });
    };

    return descriptor;
  };
}
