import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { AuthController } from '../../src/controller/authController';
import { Db, MongoClient } from 'mongodb';
import { BaseTestContainer } from '../BaseClass';
import { MigrationService } from '../../src/db/migrationService';
import { AuthService } from '../../src/service/authService';
import { v4 } from 'uuid';
import { User, UserRoles } from '../../src/model/user';
import { JwtModule, JwtService } from '@nestjs/jwt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let db: Db;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    await BaseTestContainer.setup();
    const mongoUri = BaseTestContainer.getMongoUri();
    mongoClient = await new MongoClient(mongoUri).connect();
    db = mongoClient.db('test');

    moduleFixture = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        })
      ],
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
      .compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);

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

  afterEach(async () => {
    await db.collection('users').deleteMany({});
  })

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
      };

      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');
      user.password = hashedPassword;

      await db.collection<OptionalId<User>>("users").insertOne(user);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: hashedPassword });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      const token = response.body.message;
      const payload = jwtService.verify(token, { secret: 'test-secret' });

      expect(payload).toBeDefined();
      expect(payload.email).toBe(user.email);
      expect(payload.roles).toEqual(user.roles);
    });

    it('/auth/logout (POST)', async () => {
      const user = {
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: 'John Doe',
        roles: [UserRoles.USER],
        courses: [],
        allowedCourses: []
      };

      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');
      user.password = hashedPassword;

      await db.collection<OptionalId<User>>("users").insertOne(user);

      //login
      let response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: hashedPassword });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      const token = response.body.message;

      //logout
      response = await request(app.getHttpServer()).post('/auth/logout').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);

      const blacklistedTokens = await db.collection('blacklistedTokens').find().toArray();
      expect(blacklistedTokens).toBeDefined();
      expect(blacklistedTokens.length).toBe(1);
    });

    it('/auth/signup (POST)', async () => {
      const user = {
        _id: v4(),
        email: 'test@test.com',
        password: 'jrb*4RNW',
        roles: [UserRoles.USER],
        courses: [],
        allowedCourses: []
      }

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send(user);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');

      const token = response.body.message;
      const payload = jwtService.verify(token, { secret: 'test-secret' });

      expect(payload).toBeDefined();
      expect(payload.email).toBe(user.email);
      expect(payload.roles).toEqual(user.roles);

      const actualUsers = await db.collection('users').find().toArray();
      expect(actualUsers).toBeDefined()
      expect(actualUsers.length).toBe(1);
    });
  });

  describe('Negative Cases', () => {
    it('/auth/login (POST) - Missing Email or Password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);

      expect(response.body.message).toContain('Credentials are not correct');
    });

    it('/auth/login (POST) - Invalid Email Format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Credentials are not correct');
    });

    it('/auth/login (POST) - Incorrect Credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Credentials are not correct');
    });

    it('/auth/signup (POST) - Missing Email or Password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ _id: v4() });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('/auth/signup (POST) - Invalid Email Format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ email: 'invalid-email', password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email must be an email');
    });

    it('/auth/signup (POST) - Weak Password', async () => {
      const user = {
        _id: v4(),
        email: 'test@test.com',
        password: '123',
        roles: [UserRoles.USER],
        courses: [],
        allowedCourses: []
      }

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send(user);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    });

    it('/auth/logout (POST) - Not Logged In', async () => {
      const response = await request(app.getHttpServer()).post('/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });
});
