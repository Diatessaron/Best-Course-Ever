import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CommentController } from '../../src/controller/commentController';
import { CommentService } from '../../src/service/commentService';
import { BaseTestContainer } from '../BaseClass';
import { Comment } from '../../src/model/comment';
import { v4 } from 'uuid';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserRoles } from '../../src/model/user';
import { UserContextService } from '../../src/service/userContextService';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationDocument } from '../../src/db/migrationDocument';
import { BlacklistedToken } from '../../src/model/blacklistedToken';

describe('CommentController (e2e)', () => {
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
          entities: [Comment, MigrationDocument, BlacklistedToken],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          Comment,
          MigrationDocument,
          BlacklistedToken,
        ]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [CommentController],
      providers: [UserContextService, CommentService],
    }).compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    token = jwtService.sign({
      _id: v4(),
      email: 'test@test.com',
      roles: [UserRoles.USER],
    });
    dataSource = moduleFixture.get<DataSource>(DataSource);

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
    await dataSource.query('TRUNCATE TABLE "comments" CASCADE');
  });

  describe('Positive Tests', () => {
    it('/comment/:targetId (GET)', async () => {
      const comment = {
        _id: v4(),
        userId: v4(),
        targetId: v4(),
        text: 'comment text',
      };
      await dataSource.getRepository(Comment).save(comment);

      const response = await request(app.getHttpServer())
        .get(`/comment/${comment.targetId}`)
        .query({ page: 1, size: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.comments.length).toBe(1);
      expect(response.body.comments[0].text).toBe(comment.text);
      expect(response.body.total).toBe(1);
    });

    it('/comment/:targetId (GET) - Empty Response', async () => {
      const response = await request(app.getHttpServer())
        .get(`/comment/${v4()}`)
        .query({ page: 1, size: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('/comment/:targetId (POST)', async () => {
      const expectedComment = {
        _id: v4(),
        userId: v4(),
        targetId: v4(),
        text: 'comment text',
      };

      const response = await request(app.getHttpServer())
        .post(`/comment/${expectedComment.targetId}`)
        .send(expectedComment)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(201);
      const actualComment = await dataSource.getRepository(Comment).findOne({
        where: { _id: expectedComment._id },
      });
      expect(actualComment.text).toBe(expectedComment.text);
      expect(actualComment.userId).toBe(expectedComment.userId);
      expect(actualComment.targetId).toBe(expectedComment.targetId);
    });

    it('/comment/:commentId (PUT)', async () => {
      const comment = {
        _id: v4(),
        userId: v4(),
        targetId: v4(),
        text: 'comment text',
      };
      await dataSource.getRepository(Comment).save(comment);

      const response = await request(app.getHttpServer())
        .put(`/comment/${comment._id}`)
        .send({ text: 'Updated comment text' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const actualComment = await dataSource.getRepository(Comment).findOne({
        where: { _id: comment._id },
      });
      expect(actualComment.text).toBe('Updated comment text');
    });

    it('/comment/:commentId (DELETE)', async () => {
      const comment = {
        _id: v4(),
        userId: v4(),
        targetId: v4(),
        text: 'comment text',
      };
      await dataSource.getRepository(Comment).save(comment);

      const response = await request(app.getHttpServer())
        .delete(`/comment/${comment._id}`)
        .send({ text: 'Updated comment text' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const actualComment = await dataSource.getRepository(Comment).findOne({
        where: { _id: comment._id },
      });
      expect(actualComment).toBeFalsy();
    });
  });

  describe('Negative Cases', () => {
    it('/comment/:targetId (GET) - Invalid Target ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/comment/invalid-id')
        .query({ page: 1, size: 10 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('/comment/:targetId (POST) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/comment/${v4()}`)
        .send({})
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('/comment/:targetId (POST) - Invalid Payload', async () => {
      const response = await request(app.getHttpServer())
        .post(`/comment/${v4()}`)
        .send({ invalidField: 'Invalid data' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('/comment/:commentId (PUT) - Non-existent Comment ID', async () => {
      const response = await request(app.getHttpServer())
        .put(`/comment/${v4()}`)
        .send({ text: 'Updated comment text' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('/comment/:commentId (PUT) - Missing Required Fields', async () => {
      const response = await request(app.getHttpServer())
        .put(`/comment/${v4()}`)
        .send({})
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Text for the comment must be provided and cannot be empty.',
      );
    });

    it('/comment/:commentId (DELETE) - Non-existent Comment ID', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/comment/${v4()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
