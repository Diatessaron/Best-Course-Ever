import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { SurveyController } from '../../src/controller/surveyController';
import { DataSource } from 'typeorm';
import { BaseTestContainer } from '../BaseClass';
import { MigrationService } from '../../src/db/migrationService';
import { SurveyService } from '../../src/service/surveyService';
import { v4 } from 'uuid';
import { Survey, SurveyType } from '../../src/model/survey';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { User, UserRoles } from '../../src/model/user';
import { UserContextService } from '../../src/service/userContextService';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationDocument } from '../../src/db/migrationDocument';
import { BlacklistedToken } from '../../src/model/blacklistedToken';

describe('SurveyController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let token: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    await BaseTestContainer.setup();
    const databaseUri = BaseTestContainer.getDatabaseUri();

    moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: databaseUri,
          entities: [User, Survey, MigrationDocument, BlacklistedToken],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          User,
          Survey,
          MigrationDocument,
          BlacklistedToken,
        ]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [SurveyController],
      providers: [UserContextService, SurveyService, MigrationService],
    }).compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    token = jwtService.sign({
      _id: v4(),
      email: 'test@test.com',
      roles: [UserRoles.USER],
    });
    dataSource = moduleFixture.get<DataSource>(DataSource);

    //needed to make sure that migrations were executed
    const migrationService =
      moduleFixture.get<MigrationService>(MigrationService);
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
    await app.close();
  });

  afterEach(async () => {
    await dataSource.query('TRUNCATE TABLE "surveys" CASCADE');
    await dataSource.query('TRUNCATE TABLE "users" CASCADE');
  });

  describe('Positive Tests', () => {
    it('/survey/:targetId (POST) - Add a survey', async () => {
      const user = (
        await dataSource.getRepository(User).insert({
          _id: v4(),
          email: 'test1@test.com',
          password: 'password',
          name: 'Max Doe',
          roles: [UserRoles.USER],
          courses: [v4()],
          allowedCourses: [v4()],
        })
      ).identifiers[0];

      const surveyRepository = dataSource.getRepository(Survey);
      const survey = {
        _id: v4(),
        type: 'INTERESTING',
        userId: user._id,
        targetId: v4(),
        rank: 1,
      };

      const response = await request(app.getHttpServer())
        .post(`/survey/${survey.targetId}`)
        .send(survey)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(201);

      const actualSurvey = await surveyRepository.findOne({
        where: { _id: survey._id },
      });
      expect(actualSurvey).toBeTruthy();
      expect(actualSurvey.targetId).toBe(survey.targetId);
      expect(actualSurvey.userId).toBe(survey.userId);
      expect(actualSurvey.type).toBe(survey.type);
      expect(actualSurvey.rank).toBe(survey.rank);
    });
  });

  describe('Negative Tests', () => {
    it('/survey/:targetId (POST) - Invalid Data Types', async () => {
      const response = await request(app.getHttpServer())
        .post(`/survey/${v4()}`)
        .send({
          _id: v4(),
          type: 'INTERESTING',
          rank: 'not-a-number',
        })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('rank must be an integer number');
    });

    it('/survey/:targetId (POST) - Invalid Target ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/survey/invalid-id')
        .send({
          difficultyRank: 4,
          interestingRank: 5,
        })
        .set('Authorization', `Bearer ${token}`);

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
        })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'rank must not be greater than 5',
      );
    });
  });
});
