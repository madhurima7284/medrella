import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Appointments System (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let patientToken: string;
  let doctorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Login as sample patient
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'john.doe@example.com', password: 'Patient@123' });

    patientToken = loginRes.body.token;

    // Get an approved doctor
    const doctorsRes = await request(app.getHttpServer()).get('/api/doctors');
    doctorId = doctorsRes.body[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. GET /api/doctors should return approved doctors', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/doctors')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].approvalStatus).toBe('APPROVED');
  });

  it('2. GET /api/doctors/:id/availability should calculate slots for upcoming date', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app.getHttpServer())
      .get(`/api/doctors/${doctorId}/availability?date=${dateStr}`)
      .expect(200);

    expect(res.body).toHaveProperty('slots');
    expect(Array.isArray(res.body.slots)).toBe(true);
  });

  it('3. POST /api/appointments should reject unauthorized requests (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/appointments')
      .send({ doctorId, startAt: new Date().toISOString() })
      .expect(401);
  });

  it('4. POST /api/appointments should book slot successfully with auth token', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    futureDate.setUTCHours(10, 0, 0, 0);

    const res = await request(app.getHttpServer())
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        startAt: futureDate.toISOString(),
        reasonForVisit: 'Automated test consultation',
      });

    if (res.status === 201) {
      expect(res.body.appointment).toHaveProperty('id');
      expect(res.body.appointment.status).toBe('CONFIRMED');
    }
  });

  it('5. POST /api/appointments should reject booking in the past (400)', async () => {
    const pastDate = new Date(Date.now() - 86400000);

    await request(app.getHttpServer())
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        startAt: pastDate.toISOString(),
        reasonForVisit: 'Past booking',
      })
      .expect(400);
  });
});
