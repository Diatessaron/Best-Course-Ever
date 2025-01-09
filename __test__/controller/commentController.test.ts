import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CommentController } from '../../src/controller/commentController';
import { CommentService } from '../../src/service/commentService';
import { BaseTestContainer } from '../BaseClass';
import { Db, MongoClient } from 'mongodb';
import { Comment } from '../../src/model/comment';
import { v4 } from 'uuid';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserRoles } from '../../src/model/user';

describe('CommentController (e2e)', () => {
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
    db = mongoClient.db("test")

    moduleFixture = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        })
      ],
      controllers: [CommentController],
      providers: [
        CommentService,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: db,
        },
      ],
    })
      .compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    token = jwtService.sign({ _id: v4(), email: 'test@test.com', roles: [UserRoles.USER] })

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
    await moduleFixture.close()
    await BaseTestContainer.teardown()
    await mongoClient.close()
    await app.close();
  });

  describe('Positive Tests', () => {
    it('/comment/:targetId (GET)', async () => {
      const comment = { _id: v4(), userId: v4(), targetId: v4(), text: "comment text" };
      await db.collection<OptionalId<Comment>>('comments').insertOne(comment);

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
      const response = await request(app.getHttpServer()).get(`/comment/${v4()}`).query({ page: 1, size: 10 }).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('/comment/:targetId (POST)', async () => {
      const expectedComment = { _id: v4(), userId: v4(), targetId: v4(), text: "comment text" };

      const response = await request(app.getHttpServer())
        .post(`/comment/${expectedComment.targetId}`)
        .send(expectedComment)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(201);
      const actualComment = await db.collection<OptionalId<Comment>>('comments').findOne({ _id: expectedComment._id });
      expect(actualComment.text).toBe(expectedComment.text);
      expect(actualComment.userId).toBe(expectedComment.userId);
      expect(actualComment.targetId).toBe(expectedComment.targetId);
    });

    it('/comment/:commentId (PUT)', async () => {
      const comment = { _id: v4(), userId: v4(), targetId: v4(), text: "comment text" };
      await db.collection<OptionalId<Comment>>('comments').insertOne(comment);

      const response = await request(app.getHttpServer())
        .put(`/comment/${comment._id}`)
        .send({ text: 'Updated comment text' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const actualComment = await db.collection<OptionalId<Comment>>('comments').findOne({ _id: comment._id })
      expect(actualComment.text).toBe('Updated comment text');
    });

    it('/comment/:commentId (DELETE)', async () => {
      const comment = { _id: v4(), userId: v4(), targetId: v4(), text: "comment text"};
      await db.collection<OptionalId<Comment>>('comments').insertOne(comment);

      const response = await request(app.getHttpServer())
        .delete(`/comment/${comment._id}`)
        .send({ text: 'Updated comment text' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const actualComment = await db.collection<OptionalId<Comment>>('comments').findOne({ _id: comment._id })
      expect(actualComment).toBeFalsy()
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
      expect(response.body.message).toContain('Text for the comment must be provided and cannot be empty.');
    });

    it('/comment/:commentId (DELETE) - Non-existent Comment ID', async () => {
      const response = await request(app.getHttpServer()).delete(`/comment/${v4()}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
