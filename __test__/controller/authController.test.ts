import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { AuthController } from '../../src/controller/authController';
import { Db, MongoClient } from 'mongodb';
import { BaseTestContainer } from '../BaseClass.test';
import { MigrationService } from '../../src/db/migrationService';
import { AuthGuard } from '../../src/guard/authGuard';
import { RolesGuard } from '../../src/guard/rolesGuard';
import { AuthService } from '../../src/service/authService';
import { v4 } from 'uuid';
import { User, UserRoles } from '../../src/model/user';

describe('AuthController (e2e)', () => {
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
      controllers: [AuthController],
      providers: [
        AuthService,
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

  describe('Positive cases', () => {
    it('/auth/login (POST)', async () => {
      const user = {
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: 'John Doe',
        roles: [UserRoles.USER],
        courses: [],
        allowedCourses: []
      }
      await db.collection<OptionalId<User>>("users").insertOne(user)
      const hashedPassword = crypto.createHash('md5').update(user.password).digest('hex')

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: hashedPassword });

      expect(response.status).toBe(201);
    });

    it('/auth/logout (POST)', async () => {
      const response = await request(app.getHttpServer()).post('/auth/logout');
      expect(response.status).toBe(201);
    });

    it('/auth/signup (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ email: 'newuser@example.com', password: 'newpassword123' });

      expect(response.status).toBe(201);
    });
  });

  describe('Negative Cases', () => {
    it('/auth/login (POST) - Missing Email or Password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email must not be empty');
      expect(response.body.message).toContain('password must not be empty');
    });

    it('/auth/login (POST) - Invalid Email Format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email must be a valid email');
    });

    it('/auth/login (POST) - Incorrect Credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('/auth/signup (POST) - Missing Email or Password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email must not be empty');
      expect(response.body.message).toContain('password must not be empty');
    });

    it('/auth/signup (POST) - Invalid Email Format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ email: 'invalid-email', password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email must be a valid email');
    });

    it('/auth/signup (POST) - Weak Password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ email: 'newuser@example.com', password: '123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('password must be at least 6 characters long');
    });

    it('/auth/logout (POST) - Not Logged In', async () => {
      const response = await request(app.getHttpServer()).post('/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You must be logged in to log out');
    });
  });
});
