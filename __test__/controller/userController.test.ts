import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from '../../src/controller/userController';
import { Db, MongoClient } from 'mongodb';
import { BaseTestContainer } from '../BaseClass';
import { MigrationService } from '../../src/db/migrationService';
import { UserService } from '../../src/service/userService';
import { v4 } from 'uuid';
import { User, UserRoles } from '../../src/model/user';
import { JwtModule, JwtService } from '@nestjs/jwt';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let token: string;
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
      controllers: [UserController],
      providers: [
        UserService,
        MigrationService,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: db,
        },
      ],
    })
      .compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    token = jwtService.sign({ _id: v4(), email: 'test@test.com', roles: [UserRoles.USER] })

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

  describe('Positive Tests', () => {
    it('/user (GET) - Get all users with pagination and search', async () => {
      const user1 = {
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: "John Doe",
        roles: [UserRoles.USER],
        courses: [v4()],
        allowedCourses: [v4()]
      }
      await db.collection<OptionalId<User>>("users").insertOne(user1)

      const user2 = {
        _id: v4(),
        email: 'test1@test.com',
        password: 'password',
        name: "Max Doe",
        roles: [UserRoles.USER],
        courses: [v4()],
        allowedCourses: [v4()]
      }
      await db.collection<OptionalId<User>>("users").insertOne(user2)

      const response = await request(app.getHttpServer())
        .get('/user')
        .query({ nameQuery: 'John', page: 1, size: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1)
      expect(response.body.users[0].name).toBe(user1.name);
      expect(response.body.users[0].password).toBeFalsy()
      expect(response.body.users[0].email).toBeFalsy()
      expect(response.body.total).toBe(1)
    });

    it('/user/:id (GET) - Get a user by ID', async () => {
      const user = {
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: "Max Doe",
        roles: [UserRoles.USER],
        courses: [v4()],
        allowedCourses: [v4()]
      }
      await db.collection<OptionalId<User>>("users").insertOne(user)

      const response = await request(app.getHttpServer()).get(`/user/${user._id}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(user._id);
      expect(response.body.name).toBe(user.name);
      expect(response.body.password).toBeFalsy()
      expect(response.body.email).toBeFalsy()
    });

    it('/user/:id (PUT) - Update a user by ID', async () => {
      const user = {
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: "Max Doe",
        roles: [UserRoles.USER],
        courses: [v4()],
        allowedCourses: [v4()]
      }
      await db.collection<OptionalId<User>>("users").insertOne(user)

      const response = await request(app.getHttpServer())
        .put(`/user/${user._id}`)
        .send({
          _id: user._id,
          name: 'Updated User'
        })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const actualUser = await db.collection<OptionalId<User>>("users").findOne({ _id: user._id })
      expect(actualUser).toBeTruthy()
      expect(actualUser.name).toBe("Updated User");
    });

    it('/user/:id (DELETE) - Delete a user by ID', async () => {
      const user = {
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: "Max Doe",
        roles: [UserRoles.USER],
        courses: [v4()],
        allowedCourses: [v4()]
      }
      await db.collection<OptionalId<User>>("users").insertOne(user)

      const response = await request(app.getHttpServer()).delete(`/user/${user._id}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const actualUser = await db.collection<User>("users").findOne({ _id: user._id });
      expect(actualUser).toBeFalsy()
    });
  });

  describe('Negative Tests', () => {
    it('/user (GET) - Missing Query Params', async () => {
      const response = await request(app.getHttpServer()).get('/user').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('/user/:id (GET) - Invalid User ID', async () => {
      const response = await request(app.getHttpServer()).get('/user/invalid-id').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/user/:id (PUT) - Not Found', async () => {
      const response = await request(app.getHttpServer())
        .put(`/user/${v4()}`)
        .send({ _id: v4() })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('/user/:id (PUT) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer()).put(`/user/${v4()}`).send({}).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('_id must be a UUID');
    });

    it('/user/:id (DELETE) - Non-existent User ID', async () => {
      const response = await request(app.getHttpServer()).delete(`/user/${v4()}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
