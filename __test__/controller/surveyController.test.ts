import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SurveyController } from '../../src/controller/surveyController';
import { AuthGuard } from '../../src/guard/authGuard';
import { RolesGuard } from '../../src/guard/rolesGuard';

describe('SurveyController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SurveyController],
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
    it('/survey/:targetId (POST) - Add a survey', async () => {
      const response = await request(app.getHttpServer())
        .post('/survey/123')
        .send({
          difficultyRank: 4,
          interestingRank: 5,
          comment: 'This was a very interesting topic.',
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Negative Tests', () => {
    it('/survey/:targetId (POST) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/survey/123')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('difficultyRank should not be empty');
      expect(response.body.message).toContain('interestingRank should not be empty');
    });

    it('/survey/:targetId (POST) - Invalid Data Types', async () => {
      const response = await request(app.getHttpServer())
        .post('/survey/123')
        .send({
          difficultyRank: 'not-a-number',
          interestingRank: 'not-a-number',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('difficultyRank must be a number');
      expect(response.body.message).toContain('interestingRank must be a number');
    });

    it('/survey/:targetId (POST) - Invalid Target ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/survey/invalid-id')
        .send({
          difficultyRank: 4,
          interestingRank: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/survey/:targetId (POST) - Out-of-Range Ranks', async () => {
      const response = await request(app.getHttpServer())
        .post('/survey/123')
        .send({
          difficultyRank: 6,
          interestingRank: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('difficultyRank must be between 1 and 5');
      expect(response.body.message).toContain('interestingRank must be between 1 and 5');
    });
  });
});
