import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthGuard } from '../../src/guard/authGuard';
import { CommentController } from '../../src/controller/commentController';
import { RolesGuard } from '../../src/guard/rolesGuard';

describe('CommentController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
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
    it('/comment/:targetId (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/comment/123')
        .query({ page: 1, size: 10 });

      expect(response.status).toBe(200);
    });

    it('/comment/:targetId (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/comment/123')
        .send({ text: 'This is a test comment.' });

      expect(response.status).toBe(201);
    });

    it('/comment/:commentId (PUT)', async () => {
      const response = await request(app.getHttpServer())
        .put('/comment/456')
        .send({ text: 'Updated comment text' });

      expect(response.status).toBe(200);
    });

    it('/comment/:commentId (DELETE)', async () => {
      const response = await request(app.getHttpServer()).delete('/comment/456');

      expect(response.status).toBe(200);
    });
  });

  describe('Negative Cases', () => {
    it('/comment/:targetId (GET) - Invalid Target ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/comment/invalid-id')
        .query({ page: 1, size: 10 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/comment/:targetId (GET) - Missing Query Params', async () => {
      const response = await request(app.getHttpServer()).get('/comment/123');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('/comment/:targetId (POST) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/comment/123')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('text should not be empty');
    });

    it('/comment/:targetId (POST) - Invalid Payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/comment/123')
        .send({ invalidField: 'Invalid data' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid payload');
    });

    it('/comment/:commentId (PUT) - Non-existent Comment ID', async () => {
      const response = await request(app.getHttpServer())
        .put('/comment/non-existent-id')
        .send({ text: 'Updated comment text' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Comment not found');
    });

    it('/comment/:commentId (PUT) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer())
        .put('/comment/456')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('text should not be empty');
    });

    it('/comment/:commentId (DELETE) - Non-existent Comment ID', async () => {
      const response = await request(app.getHttpServer()).delete('/comment/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Comment not found');
    });
  });
});
