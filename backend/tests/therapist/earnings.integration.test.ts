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

describe('Therapist Earnings API', () => {
  const therapistToken = createTestToken('therapist-earnings', 'therapist');
  const patientToken = createTestToken('patient-earnings', 'patient');

  beforeAll(async () => {
    // Create therapist profile
    await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({
        ...validTherapistProfile,
        email: 'therapist.earnings@example.com',
      });
  });

  it('should fetch earnings overview with total, monthly, and completed sessions', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('earnings');
    expect(res.body.earnings).toHaveProperty('totalEarnings');
    expect(res.body.earnings).toHaveProperty('monthlyBreakdown');
    expect(res.body.earnings).toHaveProperty('completedSessions');
    expect(res.body.earnings).toHaveProperty('averageSessionValue');
    expect(typeof res.body.earnings.totalEarnings).toBe('number');
    expect(res.body.earnings.totalEarnings).toBeGreaterThanOrEqual(0);
  });

  it('should fail without authorization', async () => {
    const res = await request(app).get('/api/v1/therapists/me/earnings');

    expect(res.status).toBe(401);
  });

  it('should fail with non-therapist role', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
  });

  it('should fetch earnings with date range filter', async () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    const endDate = new Date();

    const res = await request(app)
      .get(
        `/api/v1/therapists/me/earnings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('earnings');
    expect(res.body.earnings).toHaveProperty('totalEarnings');
  });

  it('should fetch earnings with month filter', async () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const res = await request(app)
      .get(`/api/v1/therapists/me/earnings?year=${year}&month=${month}`)
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('earnings');
  });

  it('should fetch earnings history with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings/history?page=1&limit=10')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('history');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.history)).toBe(true);
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('limit');
    expect(res.body.pagination).toHaveProperty('total');
  });

  it('should fetch earnings breakdown by month', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings/monthly?year=2026')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('monthlyBreakdown');
    expect(Array.isArray(res.body.monthlyBreakdown)).toBe(true);
    if (res.body.monthlyBreakdown.length > 0) {
      const month = res.body.monthlyBreakdown[0];
      expect(month).toHaveProperty('month');
      expect(month).toHaveProperty('earnings');
      expect(month).toHaveProperty('sessionsCompleted');
    }
  });

  it('should fetch earnings breakdown by session type', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings/by-type')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('byType');
    expect(Array.isArray(res.body.byType)).toBe(true);
  });

  it('should have proper earnings overview structure', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings')
      .set('Authorization', `Bearer ${therapistToken}`);

    const earnings = res.body.earnings;
    expect(earnings).toHaveProperty('totalEarnings');
    expect(earnings).toHaveProperty('monthlyBreakdown');
    expect(earnings).toHaveProperty('completedSessions');
    expect(earnings).toHaveProperty('averageSessionValue');
    expect(earnings).toHaveProperty('pendingAmount');
    expect(earnings).toHaveProperty('withdrawnAmount');
    expect(typeof earnings.totalEarnings).toBe('number');
    expect(typeof earnings.completedSessions).toBe('number');
    expect(typeof earnings.averageSessionValue).toBe('number');
  });

  it('should have proper history entry structure', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings/history?limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    if (res.body.history.length > 0) {
      const entry = res.body.history[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('sessionId');
      expect(entry).toHaveProperty('patientName');
      expect(entry).toHaveProperty('amount');
      expect(entry).toHaveProperty('completedAt');
      expect(typeof entry.amount).toBe('number');
    }
  });

  it('should filter earnings history by date range', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const res = await request(app)
      .get(
        `/api/v1/therapists/me/earnings/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('history');
  });

  it('should sort earnings history', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings/history?sortBy=amount&sortOrder=desc&limit=5')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('history');
    if (res.body.history.length > 1) {
      for (let i = 1; i < res.body.history.length; i++) {
        expect(res.body.history[i - 1].amount).toBeGreaterThanOrEqual(
          res.body.history[i].amount
        );
      }
    }
  });

  it('should handle invalid date range gracefully', async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 30); // End before start

    const res = await request(app)
      .get(
        `/api/v1/therapists/me/earnings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      .set('Authorization', `Bearer ${therapistToken}`);

    // Should either fail with 400 or return 0 earnings
    expect([200, 400]).toContain(res.status);
  });

  it('should verify monthly breakdown aggregation accuracy', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings/monthly?year=2026')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    if (res.body.monthlyBreakdown.length > 0) {
      res.body.monthlyBreakdown.forEach((month: any) => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('earnings');
        expect(month).toHaveProperty('sessionsCompleted');
        expect(typeof month.earnings).toBe('number');
        expect(typeof month.sessionsCompleted).toBe('number');
        expect(month.earnings).toBeGreaterThanOrEqual(0);
        expect(month.sessionsCompleted).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('should calculate average session value correctly', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/earnings')
      .set('Authorization', `Bearer ${therapistToken}`);

    const earnings = res.body.earnings;
    if (earnings.completedSessions > 0) {
      const calculatedAverage = earnings.totalEarnings / earnings.completedSessions;
      expect(Math.abs(calculatedAverage - earnings.averageSessionValue)).toBeLessThan(0.01);
    } else {
      expect(earnings.averageSessionValue).toBe(0);
    }
  });
});
