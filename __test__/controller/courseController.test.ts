import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CourseController } from '../../src/controller/courseController';
import { AuthGuard } from '../../src/guard/authGuard';
import { RolesGuard } from '../../src/guard/rolesGuard';
import { Db, MongoClient } from 'mongodb';
import { BaseTestContainer } from '../BaseClass.test';
import { CourseService } from '../../src/service/courseService';
import { v4 } from 'uuid';
import { Course } from '../../src/model/course';
import { Lecture } from '../../src/model/lecture';
import { MigrationService } from '../../src/db/migrationService';
import { User } from '../../src/model/user';

describe('CourseController (e2e)', () => {
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
      controllers: [CourseController],
      providers: [
        CourseService,
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
    it('/course (GET)', async () => {
      const lecture = {
        _id: v4(),
        name: 'lecture1',
        description: 'lecture1 description',
        files: []
      }
      await db.collection<OptionalId<Lecture>>('lectures').insertOne(lecture);

      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [ lecture._id ],
      };
      await db.collection<OptionalId<Course>>('courses').insertOne(course);

      const response = await request(app.getHttpServer())
        .get('/course')
        .query({ query: 'course', page: 1, size: 10 });

      expect(response.status).toBe(200);
      expect(response.body.courses.length).toBe(1);
      expect(response.body.courses[0].name).toBe('Course');
      expect(response.body.courses[0].description).toBe('description');
      expect(response.body.courses[0].difficultyLevel).toBe(2);
      expect(response.body.courses[0].lectures.length).toBe(1);
      expect(response.body.courses[0].tags.length).toBe(2);
      expect(response.body.total).toBe(1)
      expect(response.body.page).toBe(1)
      expect(response.body.size).toBe(10)
    });

    it('/course/:id (GET)', async () => {
      const lecture = {
        _id: v4(),
        name: 'lecture1',
        description: 'lecture1 description',
        files: []
      }
      await db.collection<OptionalId<Lecture>>('lectures').insertOne(lecture);

      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [ lecture._id ],
      };
      await db.collection<OptionalId<Course>>('courses').insertOne(course);

      const response = await request(app.getHttpServer()).get(`/course/${course._id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Course');
      expect(response.body.description).toBe('description');
      expect(response.body.difficultyLevel).toBe(2);
      expect(response.body.lectures.length).toBe(1);
      expect(response.body.lectures[0]._id).toBe(lecture._id);
      expect(response.body.lectures[0].name).toBe(lecture.name);
      expect(response.body.tags.length).toBe(2);
    });

    it('/course (POST)', async () => {
      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [v4(), v4()],
      };

      const response = await request(app.getHttpServer())
        .post('/course')
        .send(course);

      expect(response.status).toBe(201);
      const actualCourse = await db.collection<OptionalId<Course>>('courses').findOne({ _id: course._id });
      expect(actualCourse).toBeTruthy()
      expect(actualCourse.name).toBe('Course');
      expect(actualCourse.description).toBe('description');
      expect(actualCourse.difficultyLevel).toBe(2);
      expect(actualCourse.lectures.length).toBe(2);
      expect(actualCourse.tags.length).toBe(2);
    });

    it('/course/:id (PUT)', async () => {
      const lecture = {
        _id: v4(),
        name: 'lecture1',
        description: 'lecture1 description',
        files: []
      }
      await db.collection<OptionalId<Lecture>>('lectures').insertOne(lecture);

      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [ lecture._id ],
      };
      await db.collection<OptionalId<Course>>('courses').insertOne(course);

      const response = await request(app.getHttpServer())
        .put(`/course/${course._id}`)
        .send({ _id: course._id, name: 'Updated Course', description: 'Updated course description' });

      expect(response.status).toBe(200);
      const actualCourse = await db.collection<OptionalId<Course>>('courses').findOne({ _id: course._id });
      expect(actualCourse).toBeTruthy()
      expect(actualCourse.name).toBe('Updated Course');
      expect(actualCourse.description).toBe('Updated course description');
      expect(actualCourse.difficultyLevel).toBe(2);
      expect(actualCourse.lectures.length).toBe(1);
      expect(actualCourse.tags.length).toBe(2);
    });

    it('/course/:id (DELETE)', async () => {
      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [],
      };
      await db.collection<OptionalId<Course>>('courses').insertOne(course);

      const response = await request(app.getHttpServer()).delete(`/course/${course._id}`);

      expect(response.status).toBe(200);
      const actualCourse = await db.collection<OptionalId<Course>>('courses').findOne({ _id: course._id });
      expect(actualCourse).toBeFalsy()
    });

    it('/course/:id/allow (POST)', async () => {
      const course = {
        _id: v4(),
        name: 'Course',
        description: 'description',
        tags: ['frontend', 'design'],
        difficultyLevel: 2,
        lectures: [],
      };
      await db.collection<OptionalId<Course>>('courses').insertOne(course);
      const user = {
        _id: v4(),
        email: 'email@email.com',
        password: 'password',
        name: 'name',
        roles: [],
        courses: [],
        allowedCourses: []
      }
      await db.collection<OptionalId<User>>('users').insertOne(user);

      const response = await request(app.getHttpServer())
        .post(`/course/${course._id}/allow`)
        .query({ userId: `${user._id}` });

      expect(response.status).toBe(200);
      const actualUser = await db.collection<OptionalId<User>>('users').findOne({ _id: user._id });
      expect(actualUser).toBeTruthy()
      expect(actualUser.allowedCourses.length).toBe(1);
      expect(actualUser.allowedCourses[0]).toBe(course._id);
    });
  });

  describe('Negative Tests', () => {
    it('/course (GET) - Missing Query Params', async () => {
      const response = await request(app.getHttpServer()).get('/course');

      expect(response.status).toBe(400);
    });

    it('/course/:id (GET) - Invalid ID', async () => {
      const response = await request(app.getHttpServer()).get('/course/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/course (POST) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer()).post('/course').send({});

      expect(response.status).toBe(400);
    });

    it('/course/:id (PUT) - Invalid Payload', async () => {
      const response = await request(app.getHttpServer())
        .put('/course/123')
        .send({ invalidField: 'Invalid data' });

      expect(response.status).toBe(400);
    });

    it('/course/:id (DELETE) - Non-existent ID', async () => {
      const id = v4();
      const response = await request(app.getHttpServer()).delete(`/course/${id}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Course with ID "${id}" not found.`);
    });

    it('/course/:id/allow (POST) - Missing userId Query Param', async () => {
      const response = await request(app.getHttpServer()).post('/course/123/allow?userId=id');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('POST /course/123/allow?userId=id | Invalid ID format');
    });
  });
});
