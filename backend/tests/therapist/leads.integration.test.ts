import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/app';
import { createTestToken } from './test-utils';

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

describe('Therapist Leads API', () => {
  const therapistToken = createTestToken('therapist-123', 'therapist');

  beforeAll(async () => {
    // Create therapist profile first
    await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({
        name: 'Dr. Lead Test',
        email: 'dr.lead.test@example.com',
        phone: '+15551234567',
        specialization: 'Anxiety Disorders',
      });
  });

  it('should fetch available leads with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/leads?page=1&limit=10')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('leads');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.leads)).toBe(true);
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('limit');
    expect(res.body.pagination).toHaveProperty('total');
  });

  it('should fail without authorization', async () => {
    const res = await request(app).get('/api/v1/therapists/me/leads');

    expect(res.status).toBe(401);
  });

  it('should fail with non-therapist role', async () => {
    const patientToken = createTestToken('patient-123', 'patient');
    const res = await request(app)
      .get('/api/v1/therapists/me/leads')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
  });

  it('should fetch leads with filters', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/leads?specialization=Anxiety&minBudget=50&maxBudget=500')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('leads');
    if (res.body.leads.length > 0) {
      res.body.leads.forEach((lead: any) => {
        expect(lead.budget).toBeGreaterThanOrEqual(50);
        expect(lead.budget).toBeLessThanOrEqual(500);
      });
    }
  });

  it('should fetch leads with sorting', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/leads?sortBy=budget&sortOrder=desc')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('leads');
  });

  it('should fetch single lead details', async () => {
    // First fetch leads
    const leadsRes = await request(app)
      .get('/api/v1/therapists/me/leads?limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    if (leadsRes.body.leads.length > 0) {
      const leadId = leadsRes.body.leads[0].id;

      const res = await request(app)
        .get(`/api/v1/therapists/me/leads/${leadId}`)
        .set('Authorization', `Bearer ${therapistToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('lead');
      expect(res.body.lead.id).toBe(leadId);
      expect(res.body.lead).toHaveProperty('patientName');
      expect(res.body.lead).toHaveProperty('issue');
      expect(res.body.lead).toHaveProperty('budget');
    }
  });

  it('should fail to fetch non-existent lead', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/leads/invalid-lead-id')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should have proper lead response structure', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/leads?limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    if (res.body.leads.length > 0) {
      const lead = res.body.leads[0];
      expect(lead).toHaveProperty('id');
      expect(lead).toHaveProperty('patientName');
      expect(lead).toHaveProperty('issue');
      expect(lead).toHaveProperty('expectedDuration');
      expect(lead).toHaveProperty('budget');
      expect(lead).toHaveProperty('status');
      expect(lead).toHaveProperty('createdAt');
    }
  });
});
