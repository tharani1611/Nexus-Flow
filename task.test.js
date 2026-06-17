const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../server');

let accessToken = '';
let workspaceId = '';
let projectId = '';
let taskId = '';
let subtaskId = '';
let checklistId = '';
let commentId = '';

const TEMP_EMAIL = `tasktest_${Date.now()}@nexusflow.dev`;
const TEMP_PASS = 'tasktest123';

before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexusflow_test');
  }

  // Register + Login
  await request(server).post('/api/auth/register').send({
    name: 'Task Tester', email: TEMP_EMAIL, password: TEMP_PASS
  });
  const loginRes = await request(server).post('/api/auth/login').send({
    email: TEMP_EMAIL, password: TEMP_PASS
  });
  accessToken = loginRes.body.accessToken;

  // Create Workspace
  const wsRes = await request(server)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Test Workspace for Tasks' });
  workspaceId = wsRes.body._id;

  // Create Project
  const projRes = await request(server)
    .post(`/api/projects/workspace/${workspaceId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Test Project', priority: 'Medium', type: 'Team' });
  projectId = projRes.body._id;
});

after(async () => {
  const User = require('../models/User');
  const Workspace = require('../models/Workspace');
  const Project = require('../models/Project');
  const Task = require('../models/Task');
  await Task.deleteMany({ project: projectId });
  await Project.findByIdAndDelete(projectId);
  await Workspace.findByIdAndDelete(workspaceId);
  await User.deleteOne({ email: TEMP_EMAIL });
  await mongoose.disconnect();
  server.close();
});

describe('Task Routes', () => {

  describe('POST /api/tasks/workspace/:workspaceId', () => {
    it('should create a new task in the project', async () => {
      const res = await request(server)
        .post(`/api/tasks/workspace/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Task #1',
          description: 'A task for testing',
          project: projectId,
          priority: 'High',
          status: 'Todo',
          storyPoints: 5
        });

      const assert = require('assert');
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.title, 'Test Task #1');
      assert.strictEqual(res.body.priority, 'High');
      taskId = res.body._id;
    });

    it('should reject task creation without title', async () => {
      const res = await request(server)
        .post(`/api/tasks/workspace/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ project: projectId });

      const assert = require('assert');
      assert.strictEqual(res.status, 400);
    });
  });

  describe('GET /api/tasks/project/:projectId', () => {
    it('should retrieve all tasks in a project', async () => {
      const res = await request(server)
        .get(`/api/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length >= 1);
    });
  });

  describe('GET /api/tasks/:taskId', () => {
    it('should retrieve task details with subtasks, checklists, comments', async () => {
      const res = await request(server)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.task);
      assert.ok(Array.isArray(res.body.subtasks));
      assert.ok(Array.isArray(res.body.checklists));
      assert.ok(Array.isArray(res.body.comments));
    });
  });

  describe('PUT /api/tasks/:taskId', () => {
    it('should update task status and priority', async () => {
      const res = await request(server)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'In Progress', priority: 'Urgent' });

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'In Progress');
      assert.strictEqual(res.body.priority, 'Urgent');
    });
  });

  describe('Subtask Routes', () => {
    it('should create a subtask on the task', async () => {
      const res = await request(server)
        .post(`/api/tasks/${taskId}/subtasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Write unit tests for feature' });

      const assert = require('assert');
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.status, 'Pending');
      subtaskId = res.body._id;
    });

    it('should mark subtask as completed', async () => {
      const res = await request(server)
        .put(`/api/tasks/subtasks/${subtaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'Completed' });

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'Completed');
    });

    it('should delete the subtask', async () => {
      const res = await request(server)
        .delete(`/api/tasks/subtasks/${subtaskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
    });
  });

  describe('Checklist Routes', () => {
    it('should create a checklist on the task', async () => {
      const res = await request(server)
        .post(`/api/tasks/${taskId}/checklists`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'QA Acceptance Criteria' });

      const assert = require('assert');
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.title, 'QA Acceptance Criteria');
      checklistId = res.body._id;
    });

    it('should add an item to the checklist', async () => {
      const res = await request(server)
        .post(`/api/tasks/checklists/${checklistId}/items`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'UI renders without errors' });

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.items.length >= 1);
    });

    it('should delete the checklist', async () => {
      const res = await request(server)
        .delete(`/api/tasks/checklists/${checklistId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
    });
  });

  describe('Comment Routes', () => {
    it('should add a comment on a task', async () => {
      const res = await request(server)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'This task looks good. Nice implementation!' });

      const assert = require('assert');
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.text);
      commentId = res.body._id;
    });

    it('should delete the comment', async () => {
      const res = await request(server)
        .delete(`/api/tasks/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
    });
  });

  describe('POST /api/tasks/:taskId/duplicate', () => {
    it('should duplicate the task', async () => {
      const res = await request(server)
        .post(`/api/tasks/${taskId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`);

      const assert = require('assert');
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.title.includes('Copy'));
    });
  });

  describe('POST /api/tasks/:taskId/archive', () => {
    it('should toggle task archive status', async () => {
      const res = await request(server)
        .post(`/api/tasks/${taskId}/archive`)
        .set('Authorization', `Bearer ${accessToken}`);

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.isArchived, true);
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    it('should delete the task', async () => {
      const res = await request(server)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const assert = require('assert');
      assert.strictEqual(res.status, 200);
    });
  });
});
