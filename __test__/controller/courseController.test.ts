import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CourseController } from '../../src/controller/courseController';
import { BaseTestContainer } from '../BaseClass';
import { CourseService } from '../../src/service/courseService';
import { v4 } from 'uuid';
import { Course } from '../../src/model/course';
import { Lecture } from '../../src/model/lecture';
import { MigrationService } from '../../src/db/migrationService';
import { User, UserRoles } from '../../src/model/user';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserContextService } from '../../src/service/userContextService';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationDocument } from '../../src/db/migrationDocument';
import { BlacklistedToken } from '../../src/model/blacklistedToken';

describe('CourseController (e2e)', () => {
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
          entities: [
            User,
            Lecture,
            Course,
            MigrationDocument,
            BlacklistedToken,
          ],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          User,
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
      controllers: [CourseController],
      providers: [UserContextService, CourseService, MigrationService],
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
    await dataSource.query('TRUNCATE TABLE "users" CASCADE');
  });

  describe('Positive Tests', () => {
    it('/course (GET)', async () => {
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
        .get('/course')
        .query({ query: 'course', page: 1, size: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.courses.length).toBe(1);
      expect(response.body.courses[0].name).toBe('Course');
      expect(response.body.courses[0].description).toBe('description');
      expect(response.body.courses[0].difficultyLevel).toBe(2);
      expect(response.body.courses[0].lectures.length).toBe(1);
      expect(response.body.courses[0].tags.length).toBe(2);
      expect(response.body.total).toBe(1);
      expect(response.body.page).toBe(1);
      expect(response.body.size).toBe(10);
    });

    it('/course/:id (GET)', async () => {
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
        .get(`/course/${course._id}`)
        .set('Authorization', `Bearer ${token}`);

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
        .send(course)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(201);
      const actualCourse = await dataSource.getRepository(Course).findOne({
        where: { _id: course._id },
      });
      expect(actualCourse).toBeTruthy();
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
        .put(`/course/${course._id}`)
        .send({
          _id: course._id,
          name: 'Updated Course',
          description: 'Updated course description',
        })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const actualCourse = await dataSource.getRepository(Course).findOne({
        where: { _id: course._id },
      });
      expect(actualCourse).toBeTruthy();
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
      await dataSource.getRepository(Course).save(course);

      const response = await request(app.getHttpServer())
        .delete(`/course/${course._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const actualCourse = await dataSource.getRepository(Course).findOne({
        where: { _id: course._id },
      });
      expect(actualCourse).toBeFalsy();
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
      await dataSource.getRepository(Course).save(course);
      const user = {
        _id: v4(),
        email: 'email@email.com',
        password: 'password',
        name: 'name',
        roles: [],
        courses: [],
        allowedCourses: [],
      };
      await dataSource.getRepository(User).save(user);

      const response = await request(app.getHttpServer())
        .post(`/course/${course._id}/allow`)
        .query({ userId: `${user._id}` })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const actualUser = await dataSource.getRepository(User).findOne({
        where: { _id: user._id },
      });
      expect(actualUser).toBeTruthy();
      expect(actualUser.allowedCourses.length).toBe(1);
      expect(actualUser.allowedCourses[0]).toBe(course._id);
    });
  });

  describe('Negative Tests', () => {
    it('/course (GET) - Missing Query Params', async () => {
      const response = await request(app.getHttpServer())
        .get('/course')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('/course/:id (GET) - Invalid ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/course/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/course (POST) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/course')
        .send({})
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('/course/:id (PUT) - Invalid Payload', async () => {
      const response = await request(app.getHttpServer())
        .put('/course/123')
        .send({ invalidField: 'Invalid data' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('/course/:id (DELETE) - Non-existent ID', async () => {
      const id = v4();
      const response = await request(app.getHttpServer())
        .delete(`/course/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Course with ID "${id}" not found.`);
    });

    it('/course/:id/allow (POST) - Missing userId Query Param', async () => {
      const response = await request(app.getHttpServer())
        .post('/course/123/allow?userId=id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'POST /course/123/allow?userId=id | Invalid ID format',
      );
    });
  });
});
