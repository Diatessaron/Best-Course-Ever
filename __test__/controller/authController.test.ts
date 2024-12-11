import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../../src/controller/authController';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Positive cases', () => {
    it('/auth/login (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '__test__@example.com', password: 'password123' });

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
