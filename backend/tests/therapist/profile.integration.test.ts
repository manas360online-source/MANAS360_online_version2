import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/app';
import { createTestToken, validTherapistProfile, invalidTherapistProfile } from './test-utils';

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

describe('Therapist Profile API', () => {
  let therapistId: string;

  it('should create therapist profile with valid data', async () => {
    const token = createTestToken('therapist-123', 'therapist');
    const res = await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(validTherapistProfile);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('therapist');
    expect(res.body.therapist.name).toBe(validTherapistProfile.name);
    expect(res.body.therapist.email).toBe(validTherapistProfile.email);
    expect(res.body.therapist.phone).toBe(validTherapistProfile.phone);
    expect(res.body.therapist.specialization).toBe(validTherapistProfile.specialization);

    therapistId = res.body.therapist.id;
  });

  it('should fail with missing authorization token', async () => {
    const res = await request(app)
      .post('/api/v1/therapists/me/profile')
      .send(validTherapistProfile);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should fail with invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', 'Bearer invalid-token')
      .send(validTherapistProfile);

    expect(res.status).toBe(401);
  });

  it('should fail with forbidden role', async () => {
    const token = createTestToken('patient-123', 'patient');
    const res = await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(validTherapistProfile);

    expect(res.status).toBe(403);
  });

  it('should fail with invalid data (name too short)', async () => {
    const token = createTestToken('therapist-456', 'therapist');
    const res = await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidTherapistProfile);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should fail with duplicate email', async () => {
    const token = createTestToken('therapist-789', 'therapist');
    const res = await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(validTherapistProfile);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('should fetch therapist profile', async () => {
    const token = createTestToken('therapist-123', 'therapist');
    const res = await request(app)
      .get('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('therapist');
    expect(res.body.therapist.id).toBe(therapistId);
  });

  it('should update therapist profile', async () => {
    const token = createTestToken('therapist-123', 'therapist');
    const updateData = {
      name: 'Dr. Jane Smith',
      specialization: 'Psychodynamic Therapy',
    };

    const res = await request(app)
      .put('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.therapist.name).toBe(updateData.name);
    expect(res.body.therapist.specialization).toBe(updateData.specialization);
  });
});
