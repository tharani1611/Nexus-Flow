const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../server');

const TEST_USER = {
  name: 'Test User NexusFlow',
  email: `test_${Date.now()}@nexusflow.dev`,
  password: 'testpassword123'
};

let accessToken = '';
let refreshToken = '';
let userId = '';

before(async () => {
  // Connect to test database if not connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexusflow_test');
  }
});

after(async () => {
  // Cleanup test user
  const User = require('../models/User');
  await User.deleteOne({ email: TEST_USER.email });
  await mongoose.disconnect();
  server.close();
});

describe('Authentication Routes', () => {

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send(TEST_USER);

      if (res.status !== 201) {
        console.error('Register failed:', res.body);
      }
      
      const assert = require('assert');
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.msg);
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send(TEST_USER);

      const assert = require('assert');
      assert.strictEqual(res.status, 400);
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({ ...TEST_USER, email: 'not-an-email' });

      const assert = require('assert');
      assert.strictEqual(res.status, 400);
    });

    it('should reject registration with short password', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'x@x.com', password: '123' });

      const assert = require('assert');
      assert.strictEqual(res.status, 400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.accessToken);
      assert.ok(res.body.refreshToken);
      assert.ok(res.body.user.id || res.body.user._id);

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
      userId = res.body.user.id || res.body.user._id;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: 'wrongpassword' });

      const assert = require('assert');
      assert.strictEqual(res.status, 400);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'nobody@nexusflow.dev', password: 'pass123' });

      const assert = require('assert');
      assert.strictEqual(res.status, 400);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should retrieve authenticated user profile', async () => {
      const res = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.email, TEST_USER.email);
    });

    it('should reject access without token', async () => {
      const res = await request(server)
        .get('/api/auth/profile');

      const assert = require('assert');
      assert.strictEqual(res.status, 401);
    });

    it('should reject access with an invalid token', async () => {
      const res = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken12345');

      const assert = require('assert');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile name', async () => {
      const res = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Test User' });

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.name, 'Updated Test User');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should return a new access token using valid refresh token', async () => {
      const res = await request(server)
        .post('/api/auth/refresh-token')
        .send({ token: refreshToken });

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.accessToken);
      accessToken = res.body.accessToken; // update for subsequent tests
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(server)
        .post('/api/auth/refresh-token')
        .send({ token: 'invalid_refresh_token' });

      const assert = require('assert');
      assert.strictEqual(res.status, 403);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should log out the user and invalidate refresh token', async () => {
      const res = await request(server)
        .post('/api/auth/logout')
        .send({ token: refreshToken });

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
    });
  });

});
