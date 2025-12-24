// ============================================
// FILE: tests/integration/auth.test.js
// ============================================
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User.model');

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.tokens).toHaveProperty('accessToken');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456'
      };

      // Create user first
      await User.create(userData);

      // Try to register again
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.status).toBe('fail');
    });

    it('should validate password requirements', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak' // Too short and no uppercase/number
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.status).toBe('fail');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456',
        isEmailVerified: true
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123456'
        })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
    });

    it('should not login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(res.body.status).toBe('fail');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123456'
        })
        .expect(401);

      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken;

    beforeEach(async () => {
      // Create and login user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123456',
        isEmailVerified: true
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123456'
        });

      accessToken = loginRes.body.data.tokens.accessToken;
    });

    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body.status).toBe('fail');
    });
  });
});