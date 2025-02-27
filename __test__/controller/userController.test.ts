import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from '../../src/controller/userController';
import { BaseTestContainer } from '../BaseClass';
import { MigrationService } from '../../src/db/migrationService';
import { UserService } from '../../src/service/userService';
import { v4 } from 'uuid';
import { User, UserRoles } from '../../src/model/user';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserContextService } from '../../src/service/userContextService';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MigrationDocument } from '../../src/db/migrationDocument';
import { BlacklistedToken } from '../../src/model/blacklistedToken';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let jwtService: JwtService;
  let token: string;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    await BaseTestContainer.setup();
    const databaseUri = BaseTestContainer.getDatabaseUri();

    moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: databaseUri,
          entities: [User, MigrationDocument, BlacklistedToken],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, MigrationDocument, BlacklistedToken]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [UserController],
      providers: [UserContextService, UserService, MigrationService],
    }).compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    dataSource = moduleFixture.get<DataSource>(DataSource);

    token = jwtService.sign({
      id: v4(),
      email: 'test@test.com',
      roles: [UserRoles.USER],
    });
    adminToken = jwtService.sign({
      id: v4(),
      email: 'admin@test.com',
      roles: [UserRoles.ADMIN],
    });

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
    await dataSource
      .createQueryRunner()
      .query('TRUNCATE TABLE "users" CASCADE');
  });

  describe('Positive Tests', () => {
    it('/user (GET) - Get all users with pagination and search', async () => {
      const userRepository = dataSource.getRepository(User);

      const user1 = userRepository.create({
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: 'John Doe',
        roles: [UserRoles.USER],
        courses: [v4()],
        allowedCourses: [v4()],
      });
      await userRepository.save(user1);

      const user2 = userRepository.create({
        _id: v4(),
        email: 'test1@test.com',
        password: 'password',
        name: 'Max Doe',
        roles: [UserRoles.USER],
        courses: [v4()],
        allowedCourses: [v4()],
      });
      await userRepository.save(user2);

      const response = await request(app.getHttpServer())
        .get('/user')
        .query({ nameQuery: 'John', page: 1, size: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].name).toBe(user1.name);
      expect(response.body.users[0].password).toBeFalsy();
      expect(response.body.users[0].email).toBeFalsy();
      expect(response.body.total).toBe(1);
    });

    it('/user/:id (GET) - Get a user by ID', async () => {
      const userRepository = dataSource.getRepository(User);

      const user = userRepository.create({
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: 'Max Doe',
        roles: [UserRoles.USER],
        courses: [v4()],
        allowedCourses: [v4()],
      });
      await userRepository.save(user);

      const response = await request(app.getHttpServer())
        .get(`/user/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(user.name);
      expect(response.body.password).toBeFalsy();
      expect(response.body.email).toBeFalsy();
    });

    it('/user/:id (PUT) - Update a user', async () => {
      const userRepository = dataSource.getRepository(User);

      const user = userRepository.create({
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: 'Original Name',
        roles: [UserRoles.USER],
        courses: [],
        allowedCourses: [],
      });
      await userRepository.save(user);

      const updateData = {
        _id: user._id,
        name: 'Updated User',
      };

      const response = await request(app.getHttpServer())
        .put(`/user/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
    });

    it('/user/:id (DELETE) - Delete a user by ID', async () => {
      const userRepository = dataSource.getRepository(User);

      const user = userRepository.create({
        _id: v4(),
        email: 'test@test.com',
        password: 'password',
        name: 'To Be Deleted',
        roles: [UserRoles.USER],
        courses: [],
        allowedCourses: [],
      });
      await userRepository.save(user);

      const response = await request(app.getHttpServer())
        .delete(`/user/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deletedUser = await userRepository.findOne({
        where: { _id: user._id },
      });
      expect(deletedUser).toBeNull();
    });
  });

  describe('Negative Tests', () => {
    it('/user (GET) - Missing Query Params', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('/user/:id (GET) - Invalid User ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/invalid-id')
        .set('Authorization', `Bearer ${token}`);

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
      const response = await request(app.getHttpServer())
        .put(`/user/${v4()}`)
        .send({})
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('_id must be a UUID');
    });

    it('/user/:id (DELETE) - Non-existent User ID', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/user/${v4()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
