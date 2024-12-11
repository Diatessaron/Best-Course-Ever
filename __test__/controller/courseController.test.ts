import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CourseController } from '../../src/controller/courseController';
import { AuthGuard } from '../../src/guard/authGuard';
import { RolesGuard } from '../../src/guard/rolesGuard';

describe('CourseController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CourseController],
      providers: [
        {
          provide: AuthGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
        {
          provide: RolesGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Positive Tests', () => {
    it('/course (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/course')
        .query({ query: 'test', page: 1, size: 10 });

      expect(response.status).toBe(200);
      // Add expectations for the response body
    });

    it('/course/:id (GET)', async () => {
      const response = await request(app.getHttpServer()).get('/course/123');

      expect(response.status).toBe(200);
      // Add expectations for the response body
    });

    it('/course (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/course')
        .send({ name: 'Test Course', description: 'A test course description' });

      expect(response.status).toBe(201);
      // Add expectations for the response body
    });

    it('/course/:id (PUT)', async () => {
      const response = await request(app.getHttpServer())
        .put('/course/123')
        .send({ name: 'Updated Course', description: 'Updated course description' });

      expect(response.status).toBe(200);
      // Add expectations for the response body
    });

    it('/course/:id (DELETE)', async () => {
      const response = await request(app.getHttpServer()).delete('/course/123');

      expect(response.status).toBe(200);
      // Add expectations for the response body
    });

    it('/course/:id/allow (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/course/123/allow')
        .query({ userId: '456' });

      expect(response.status).toBe(200);
      // Add expectations for the response body
    });
  });

  describe('Negative Tests', () => {
    it('/course (GET) - Missing Query Params', async () => {
      const response = await request(app.getHttpServer()).get('/course');

      expect(response.status).toBe(200); // Adjust based on expected behavior, e.g., return empty or default values.
      // Add expectations for default pagination or empty result
    });

    it('/course/:id (GET) - Invalid ID', async () => {
      const response = await request(app.getHttpServer()).get('/course/invalid-id');

      expect(response.status).toBe(400); // Assuming validation for invalid IDs
      expect(response.body.message).toBeDefined();
    });

    it('/course (POST) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer()).post('/course').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name should not be empty'); // Example validation message
    });

    it('/course/:id (PUT) - Invalid Payload', async () => {
      const response = await request(app.getHttpServer())
        .put('/course/123')
        .send({ invalidField: 'Invalid data' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid payload'); // Example validation message
    });

    it('/course/:id (DELETE) - Non-existent ID', async () => {
      const response = await request(app.getHttpServer()).delete('/course/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Course not found'); // Adjust based on your implementation
    });

    it('/course/:id/allow (POST) - Missing userId Query Param', async () => {
      const response = await request(app.getHttpServer()).post('/course/123/allow');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('userId is required');
    });
  });
});
