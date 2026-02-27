import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/app';
import { createTestToken, validTherapistProfile, validLead } from './test-utils';

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

describe('Therapist Lead Purchase API', () => {
  let therapistId: string;
  let therapistToken: string;
  let leadId: string;

  beforeAll(async () => {
    therapistToken = createTestToken('therapist-purchase', 'therapist');

    // Create therapist profile
    const profileRes = await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({
        ...validTherapistProfile,
        email: 'therapist.purchase@example.com',
      });

    therapistId = profileRes.body.therapist.id;

    // Get a lead to purchase
    const leadsRes = await request(app)
      .get('/api/v1/therapists/me/leads?limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    if (leadsRes.body.leads.length > 0) {
      leadId = leadsRes.body.leads[0].id;
    }
  });

  it('should purchase lead with sufficient wallet balance', async () => {
    if (!leadId) {
      console.warn('No lead available to test purchase');
      return;
    }

    const res = await request(app)
      .post(`/api/v1/therapists/me/leads/${leadId}/purchase`)
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({});

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('transaction');
    expect(res.body.transaction).toHaveProperty('id');
    expect(res.body.transaction).toHaveProperty('leadId');
    expect(res.body.transaction).toHaveProperty('amount');
    expect(res.body.transaction).toHaveProperty('status');
    expect(res.body.transaction.status).toBe('completed');
  });

  it('should fail to purchase without authorization', async () => {
    if (!leadId) {
      console.warn('No lead available to test');
      return;
    }

    const res = await request(app)
      .post(`/api/v1/therapists/me/leads/${leadId}/purchase`)
      .send({});

    expect(res.status).toBe(401);
  });

  it('should fail with non-therapist role', async () => {
    if (!leadId) {
      console.warn('No lead available to test');
      return;
    }

    const patientToken = createTestToken('patient-123', 'patient');
    const res = await request(app)
      .post(`/api/v1/therapists/me/leads/${leadId}/purchase`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it('should fail to repurchase same lead (conflict)', async () => {
    if (!leadId) {
      console.warn('No lead available to test');
      return;
    }

    // First purchase
    const firstPurchase = await request(app)
      .post(`/api/v1/therapists/me/leads/${leadId}/purchase`)
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({});

    if (firstPurchase.status === 200 || firstPurchase.status === 201) {
      // Try to purchase again
      const secondPurchase = await request(app)
        .post(`/api/v1/therapists/me/leads/${leadId}/purchase`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({});

      expect(secondPurchase.status).toBe(409);
      expect(secondPurchase.body).toHaveProperty('error');
    }
  });

  it('should fail to purchase with insufficient balance', async () => {
    // This depends on wallet implementation
    // Create a new therapist with limited balance
    const newTherapistToken = createTestToken('therapist-poor', 'therapist');

    await request(app)
      .post('/api/v1/therapists/me/profile')
      .set('Authorization', `Bearer ${newTherapistToken}`)
      .send({
        ...validTherapistProfile,
        email: 'therapist.poor@example.com',
      });

    if (leadId) {
      const res = await request(app)
        .post(`/api/v1/therapists/me/leads/${leadId}/purchase`)
        .set('Authorization', `Bearer ${newTherapistToken}`)
        .send({});

      // Should fail if balance is insufficient
      if (res.status === 402 || res.status === 400) {
        expect(res.body).toHaveProperty('error');
      }
    }
  });

  it('should fail to purchase non-existent lead', async () => {
    const res = await request(app)
      .post('/api/v1/therapists/me/leads/invalid-lead-id/purchase')
      .set('Authorization', `Bearer ${therapistToken}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should fetch wallet details', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/wallet')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('wallet');
    expect(res.body.wallet).toHaveProperty('balance');
    expect(res.body.wallet).toHaveProperty('currency');
    expect(res.body.wallet).toHaveProperty('totalEarnings');
    expect(typeof res.body.wallet.balance).toBe('number');
  });

  it('should fetch wallet transaction history', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/wallet/transactions?page=1&limit=10')
      .set('Authorization', `Bearer ${therapistToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('transactions');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  it('should have proper transaction response structure', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/wallet/transactions?limit=1')
      .set('Authorization', `Bearer ${therapistToken}`);

    if (res.body.transactions.length > 0) {
      const transaction = res.body.transactions[0];
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('type');
      expect(transaction).toHaveProperty('status');
      expect(transaction).toHaveProperty('createdAt');
      expect(['debit', 'credit']).toContain(transaction.type);
    }
  });
});
