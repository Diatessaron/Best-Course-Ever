import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from '../../src/controller/userController';
import { AuthGuard } from '../../src/guard/authGuard';
import { RolesGuard } from '../../src/guard/rolesGuard';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
    }).overrideGuard(AuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Positive Tests', () => {
    it('/user (GET) - Get all users with pagination and search', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .query({ nameQuery: 'John', page: 1, size: 10 });

      expect(response.status).toBe(200);
    });

    it('/user/:id (GET) - Get a user by ID', async () => {
      const response = await request(app.getHttpServer()).get('/user/123');

      expect(response.status).toBe(200);
    });

    it('/user/:id (PUT) - Update a user by ID', async () => {
      const response = await request(app.getHttpServer())
        .put('/user/123')
        .send({
          name: 'Updated User',
          email: 'updateduser@example.com',
        });

      expect(response.status).toBe(200);
    });

    it('/user/:id (DELETE) - Delete a user by ID', async () => {
      const response = await request(app.getHttpServer()).delete('/user/123');

      expect(response.status).toBe(200);
    });
  });

  describe('Negative Tests', () => {
    it('/user (GET) - Missing Query Params', async () => {
      const response = await request(app.getHttpServer()).get('/user');

      expect(response.status).toBe(200);
    });

    it('/user/:id (GET) - Invalid User ID', async () => {
      const response = await request(app.getHttpServer()).get('/user/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/user/:id (PUT) - Invalid Payload', async () => {
      const response = await request(app.getHttpServer())
        .put('/user/123')
        .send({
          invalidField: 'Invalid data',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid payload');
    });

    it('/user/:id (PUT) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer()).put('/user/123').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name should not be empty');
    });

    it('/user/:id (DELETE) - Non-existent User ID', async () => {
      const response = await request(app.getHttpServer()).delete('/user/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });
});
