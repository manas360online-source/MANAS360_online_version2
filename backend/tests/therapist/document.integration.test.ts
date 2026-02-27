import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import app from '../../src/app';
import { createTestToken } from './test-utils';
import { mockS3Service } from './s3.mock';

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

describe('Therapist Document Upload API', () => {
  const token = createTestToken('therapist-123', 'therapist');
  const testFilePath = path.join(__dirname, '../fixtures/test-credential.pdf');

  // Create test fixture if it doesn't exist
  beforeAll(() => {
    const fixtureDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true });
    }
    if (!fs.existsSync(testFilePath)) {
      fs.writeFileSync(testFilePath, Buffer.from('PDF Test Content'));
    }
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('should upload credential document with valid file', async () => {
    jest.clearAllMocks();
    mockS3Service.uploadFile.mockResolvedValueOnce({
      fileUrl: 'https://mock-s3.com/therapist-cred-12345.pdf',
      key: 'therapist-docs/cred-12345',
    });

    const res = await request(app)
      .post('/api/v1/therapists/me/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'license')
      .attach('file', testFilePath);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('document');
    expect(res.body.document.type).toBe('license');
    expect(res.body.document.fileUrl).toBe('https://mock-s3.com/therapist-cred-12345.pdf');
    expect(mockS3Service.uploadFile).toHaveBeenCalled();
  });

  it('should fail without authorization token', async () => {
    const res = await request(app)
      .post('/api/v1/therapists/me/documents')
      .field('documentType', 'license')
      .attach('file', testFilePath);

    expect(res.status).toBe(401);
  });

  it('should fail with forbidden role', async () => {
    const patientToken = createTestToken('patient-123', 'patient');
    const res = await request(app)
      .post('/api/v1/therapists/me/documents')
      .set('Authorization', `Bearer ${patientToken}`)
      .field('documentType', 'license')
      .attach('file', testFilePath);

    expect(res.status).toBe(403);
  });

  it('should fail without file', async () => {
    const res = await request(app)
      .post('/api/v1/therapists/me/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'license');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should fail with invalid document type', async () => {
    const res = await request(app)
      .post('/api/v1/therapists/me/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'invalid-type')
      .attach('file', testFilePath);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should fetch therapist documents', async () => {
    const res = await request(app)
      .get('/api/v1/therapists/me/documents')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('documents');
    expect(Array.isArray(res.body.documents)).toBe(true);
  });

  it('should delete therapist document', async () => {
    // First upload a document
    mockS3Service.uploadFile.mockResolvedValueOnce({
      fileUrl: 'https://mock-s3.com/therapist-cred-delete.pdf',
      key: 'therapist-docs/cred-delete',
    });

    const uploadRes = await request(app)
      .post('/api/v1/therapists/me/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'degree')
      .attach('file', testFilePath);

    const documentId = uploadRes.body.document.id;

    // Then delete it
    mockS3Service.deleteFile.mockResolvedValueOnce(true);
    const deleteRes = await request(app)
      .delete(`/api/v1/therapists/me/documents/${documentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toHaveProperty('message');
  });

  it('should get signed URL for document', async () => {
    const token = createTestToken('therapist-123', 'therapist');
    
    // Fetch documents to get a document ID
    const docsRes = await request(app)
      .get('/api/v1/therapists/me/documents')
      .set('Authorization', `Bearer ${token}`);

    if (docsRes.body.documents.length > 0) {
      const documentId = docsRes.body.documents[0].id;

      const signedUrlRes = await request(app)
        .get(`/api/v1/therapists/me/documents/${documentId}/signed-url`)
        .set('Authorization', `Bearer ${token}`);

      expect(signedUrlRes.status).toBe(200);
      expect(signedUrlRes.body).toHaveProperty('signedUrl');
      expect(mockS3Service.getSignedUrl).toHaveBeenCalled();
    }
  });
});
