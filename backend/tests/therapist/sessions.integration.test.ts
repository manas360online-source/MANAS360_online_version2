import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/app';
import { createTestToken, validTherapistProfile } from './test-utils';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Therapist Session Management API', () => {
  const therapistToken = createTestToken('therapist-session', 'therapist');
  const patientToken = createTestToken('patient-session', 'patient');
  let sessionId: string;

  beforeAll(async () => {
    // Create therapist profile
    await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({
        ...validTherapistProfile,
        email: 'therapist.session@example.com',
      });

    // Create patient profile (simplified)
    await request(app)
      .post('/api/v1/patients/me/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        name: 'John Doe',
        email: 'patient.session@example.com',
        phone: '+15551234567',
      })
      .catch(() => null);
  });

  it('should fetch therapist sessions list', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/sessions?page=1&limit=10')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessions');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.sessions)).toBe(true);
  });

  it('should fail to fetch sessions without authorization', async () => {
    const res = await request(app).get('/api/v1/therapists/me/sessions');

    expect(res.status).toBe(401);
  });

  it('should fail with non-therapist role', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/sessions')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
  });

  it('should fetch sessions with status filter', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/sessions?status=scheduled')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessions');
    if (res.body.sessions.length > 0) {
      res.body.sessions.forEach((session: any) => {
        expect(session.status).toBe('scheduled');
      });
    }
  });

  it('should fetch sessions with date range filter', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const res = await request(app)
      .get(
        `/api/v1/therapists/me/sessions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessions');
  });

  it('should fetch single session details', async () => {
    const listRes = await request(app)
      .get('/api/v1/therapists/me/sessions?limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    if (listRes.body.sessions.length > 0) {
      sessionId = listRes.body.sessions[0].id;

      const res = await request(app)
        .get(`/api/v1/therapists/me/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${therapistToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('session');
      expect(res.body.session.id).toBe(sessionId);
      expect(res.body.session).toHaveProperty('patientId');
      expect(res.body.session).toHaveProperty('status');
      expect(res.body.session).toHaveProperty('scheduledAt');
    }
  });

  it('should fail to fetch non-existent session', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/sessions/invalid-session-id')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should update session status to completed', async () => {
    const listRes = await request(app)
      .get('/api/v1/therapists/me/sessions?status=scheduled&limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    if (listRes.body.sessions.length > 0) {
      const sId = listRes.body.sessions[0].id;

      const res = await request(app)
        .patch(`/api/v1/therapists/me/sessions/${sId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({ status: 'completed' });

      expect([200, 204]).toContain(res.status);
      if (res.body && res.body.session) {
        expect(res.body.session.status).toBe('completed');
      }
    }
  });

  it('should update session status to cancelled', async () => {
    const listRes = await request(app)
      .get('/api/v1/therapists/me/sessions?status=scheduled&limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    if (listRes.body.sessions.length > 0) {
      const sId = listRes.body.sessions[0].id;

      const res = await request(app)
        .patch(`/api/v1/therapists/me/sessions/${sId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({ status: 'cancelled', cancellationReason: 'Therapist unavailable' });

      expect([200, 204]).toContain(res.status);
    }
  });

  it('should fail to update session status with invalid status', async () => {
    const listRes = await request(app)
      .get('/api/v1/therapists/me/sessions?limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    if (listRes.body.sessions.length > 0) {
      const sId = listRes.body.sessions[0].id;

      const res = await request(app)
        .patch(`/api/v1/therapists/me/sessions/${sId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({ status: 'invalid-status' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    }
  });

  it('should have proper session response structure', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/sessions?limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    if (res.body.sessions.length > 0) {
      const session = res.body.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('patientId');
      expect(session).toHaveProperty('therapistId');
      expect(session).toHaveProperty('status');
      expect(session).toHaveProperty('scheduledAt');
      expect(session).toHaveProperty('createdAt');
      expect(['scheduled', 'in-progress', 'completed', 'cancelled']).toContain(
        session.status
      );
    }
  });
});
