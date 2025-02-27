import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { LectureController } from '../../src/controller/lectureController';
import { BaseTestContainer } from '../BaseClass';
import { MigrationService } from '../../src/db/migrationService';
import { LectureService } from '../../src/service/lectureService';
import { v4 } from 'uuid';
import { Lecture } from '../../src/model/lecture';
import { Course } from '../../src/model/course';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserRoles } from '../../src/model/user';
import { UserContextService } from '../../src/service/userContextService';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationDocument } from '../../src/db/migrationDocument';
import { BlacklistedToken } from '../../src/model/blacklistedToken';

describe('LectureController (e2e)', () => {
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
          entities: [Lecture, Course, MigrationDocument, BlacklistedToken],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          Lecture,
          Course,
          MigrationDocument,
          BlacklistedToken,
        ]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [LectureController],
      providers: [UserContextService, LectureService, MigrationService],
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
    await dataSource.query('TRUNCATE TABLE "lectures" CASCADE');
    await dataSource.query('TRUNCATE TABLE "courses" CASCADE');
  });

  describe('Positive Tests', () => {
    it('/lecture/:courseId (GET)', async () => {
      const lecture = {
        _id: v4(),
        name: 'lecture1',
        description: 'lecture1 description',
        files: [],
      };
      await dataSource.getRepository(Lecture).save(lecture);

      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [lecture._id],
      };
      await dataSource.getRepository(Course).save(course);

      const response = await request(app.getHttpServer())
        .get(`/lecture/${course._id}`)
        .query({ page: 1, size: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.lectures.length).toBe(1);
      expect(response.body.lectures[0].name).toBe(lecture.name);
      expect(response.body.lectures[0].description).toBe(lecture.description);
      expect(response.body.lectures[0].files.length).toBe(0);
      expect(response.body.page).toBe(1);
      expect(response.body.size).toBe(10);
    });

    it('/lecture/:courseId/:lectureId (GET)', async () => {
      const lecture = {
        _id: v4(),
        name: 'lecture1',
        description: 'lecture1 description',
        files: [],
      };
      await dataSource.getRepository(Lecture).save(lecture);

      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [lecture._id],
      };
      await dataSource.getRepository(Course).save(course);

      const response = await request(app.getHttpServer())
        .get(`/lecture/${course._id}/${lecture._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(lecture._id);
      expect(response.body.name).toBe(lecture.name);
      expect(response.body.description).toBe(lecture.description);
      expect(response.body.files.length).toBe(0);
    });

    it('/lecture/:courseId (POST)', async () => {
      const lecture = {
        _id: v4(),
        name: 'lecture1',
        description: 'lecture1 description',
        files: [],
      };

      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [lecture._id],
      };
      await dataSource.getRepository(Course).save(course);

      const response = await request(app.getHttpServer())
        .post(`/lecture/${course._id}`)
        .send(lecture)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(201);

      const actualLecture = await dataSource.getRepository(Lecture).findOne({
        where: { _id: lecture._id },
      });
      expect(actualLecture).toBeTruthy();
      expect(actualLecture.name).toBe(lecture.name);
      expect(actualLecture.description).toBe(lecture.description);
      expect(actualLecture.files.length).toBe(0);
    });

    it('/lecture/:courseId/:lectureId (PUT)', async () => {
      const lecture = {
        _id: v4(),
        name: 'lecture1',
        description: 'lecture1 description',
        files: [],
      };
      await dataSource.getRepository(Lecture).save(lecture);

      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [lecture._id],
      };
      await dataSource.getRepository(Course).save(course);

      const response = await request(app.getHttpServer())
        .put(`/lecture/${course._id}/${lecture._id}`)
        .send({ _id: lecture._id, description: 'Updated Description' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      const actualLecture = await dataSource.getRepository(Lecture).findOne({
        where: { _id: lecture._id },
      });
      expect(actualLecture).toBeTruthy();
      expect(actualLecture.description).toBe('Updated Description');
    });

    it('/lecture/:courseId/:lectureId (DELETE)', async () => {
      const lecture = {
        _id: v4(),
        name: 'lecture1',
        description: 'lecture1 description',
        files: [],
      };
      await dataSource.getRepository(Lecture).save(lecture);

      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [lecture._id],
      };
      await dataSource.getRepository(Course).save(course);

      const response = await request(app.getHttpServer())
        .delete(`/lecture/${course._id}/${lecture._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      const actualLecture = await dataSource.getRepository(Lecture).findOne({
        where: { _id: lecture._id },
      });
      expect(actualLecture).toBeFalsy();
    });
  });

  describe('Negative Tests', () => {
    it('/lecture/:courseId (GET) - Missing Query Params', async () => {
      const response = await request(app.getHttpServer())
        .get('/lecture/123')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('/lecture/:courseId (GET) - Invalid Course ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/lecture/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/lecture/:courseId/:lectureId (GET) - Invalid Lecture ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/lecture/123/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/lecture/:courseId (POST) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/lecture/${v4()}`)
        .send({})
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('/lecture/:courseId/:lectureId (PUT) - Not found', async () => {
      const response = await request(app.getHttpServer())
        .put(`/lecture/${v4()}/${v4()}`)
        .send({ _id: v4() })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('/lecture/:courseId/:lectureId (DELETE) - Non-existent Lecture ID', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/lecture/${v4()}/${v4()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
