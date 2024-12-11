import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LectureController } from '../../src/controller/lectureController';
import { AuthGuard } from '../../src/guard/authGuard';
import { RolesGuard } from '../../src/guard/rolesGuard';

describe('LectureController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LectureController],
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
    it('/lecture/:courseId (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/lecture/123')
        .query({ page: 1, size: 10 });

      expect(response.status).toBe(200);
    });

    it('/lecture/:courseId/:lectureId (GET)', async () => {
      const response = await request(app.getHttpServer()).get('/lecture/123/456');

      expect(response.status).toBe(200);
    });

    it('/lecture/:courseId (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/lecture/123')
        .send({ title: 'Test Lecture', content: 'Lecture Content' });

      expect(response.status).toBe(201);
    });

    it('/lecture/:courseId/:lectureId (PUT)', async () => {
      const response = await request(app.getHttpServer())
        .put('/lecture/123/456')
        .send({ title: 'Updated Lecture', content: 'Updated Content' });

      expect(response.status).toBe(200);
    });

    it('/lecture/:courseId/:lectureId (DELETE)', async () => {
      const response = await request(app.getHttpServer()).delete('/lecture/123/456');

      expect(response.status).toBe(200);
    });
  });

  describe('Negative Tests', () => {
    it('/lecture/:courseId (GET) - Missing Query Params', async () => {
      const response = await request(app.getHttpServer()).get('/lecture/123');

      expect(response.status).toBe(200);
    });

    it('/lecture/:courseId (GET) - Invalid Course ID', async () => {
      const response = await request(app.getHttpServer()).get('/lecture/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/lecture/:courseId/:lectureId (GET) - Invalid Lecture ID', async () => {
      const response = await request(app.getHttpServer()).get('/lecture/123/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/lecture/:courseId (POST) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer()).post('/lecture/123').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('title should not be empty');
    });

    it('/lecture/:courseId/:lectureId (PUT) - Invalid Payload', async () => {
      const response = await request(app.getHttpServer())
        .put('/lecture/123/456')
        .send({ invalidField: 'Invalid data' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid payload'); // Example validation message
    });

    it('/lecture/:courseId/:lectureId (DELETE) - Non-existent Lecture ID', async () => {
      const response = await request(app.getHttpServer()).delete('/lecture/123/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Lecture not found');
    });
  });
});
