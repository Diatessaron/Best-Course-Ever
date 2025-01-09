import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { SurveyController } from '../../src/controller/surveyController';
import { AuthGuard } from '../../src/guard/authGuard';
import { RolesGuard } from '../../src/guard/rolesGuard';
import { Db, MongoClient } from 'mongodb';
import { BaseTestContainer } from '../BaseClass.test';
import { MigrationService } from '../../src/db/migrationService';
import { SurveyService } from '../../src/service/surveyService';
import { v4 } from 'uuid';
import { Survey, SurveyType } from '../../src/model/survey';

describe('SurveyController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let db: Db;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    await BaseTestContainer.setup();
    const mongoUri = BaseTestContainer.getMongoUri();
    mongoClient = await new MongoClient(mongoUri).connect();
    db = mongoClient.db('test');

    moduleFixture = await Test.createTestingModule({
      controllers: [SurveyController],
      providers: [
        SurveyService,
        MigrationService,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: db,
        },
      ],
    })
      .overrideGuard(AuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    //needed to make sure that migrations were executed
    const migrationService = moduleFixture.get<MigrationService>(MigrationService);
    await migrationService.runMigrations();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await moduleFixture.close();
    await BaseTestContainer.teardown();
    await mongoClient.close();
    await app.close();
  });

  describe('Positive Tests', () => {
    it('/survey/:targetId (POST) - Add a survey', async () => {
      const survey = {
        _id: v4(),
        type: "INTERESTING",
        userId: v4(),
        targetId: v4(),
        rank: 1
      }

      const response = await request(app.getHttpServer())
        .post(`/survey/${survey.targetId}`)
        .send(survey);

      expect(response.status).toBe(201);

      const actualSurvey = await db.collection<Survey>("surveys").findOne({ _id: survey._id })
      expect(actualSurvey).toBeTruthy()
      expect(actualSurvey.targetId).toBe(survey.targetId)
      expect(actualSurvey.userId).toBe(survey.userId)
      expect(actualSurvey.type).toBe(survey.type)
      expect(actualSurvey.rank).toBe(survey.rank)
    });
  });

  describe('Negative Tests', () => {
    it('/survey/:targetId (POST) - Invalid Data Types', async () => {
      const response = await request(app.getHttpServer())
        .post(`/survey/${v4()}`)
        .send({
          _id: v4(),
          type: "INTERESTING",
          rank: 'not-a-number',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('rank must be an integer number');
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
        .post(`/survey/${v4()}`)
        .send({
          _id: v4(),
          type: SurveyType.DIFFICULT,
          rank: 6,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('rank must not be greater than 5');
    });
  });
});
