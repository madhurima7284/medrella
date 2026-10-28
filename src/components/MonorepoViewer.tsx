import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Layers,
  Database,
  Terminal,
  Server,
  Cloud,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export const MonorepoViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TREE' | 'SWAGGER' | 'DEPLOY' | 'DATABASE'>('TREE');
  const [selectedFile, setSelectedFile] = useState<string>('schema.prisma');
  const [copied, setCopied] = useState(false);

  const fileContents: Record<string, { lang: string; path: string; content: string }> = {
    'schema.prisma': {
      lang: 'prisma',
      path: 'doctor-appointment-scheduler/backend/prisma/schema.prisma',
      content: `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  PATIENT
  DOCTOR
  ADMIN
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  REJECTED
  COMPLETED
}

model User {
  id           String          @id @default(uuid())
  fullName     String
  email        String          @unique
  passwordHash String
  role         Role            @default(PATIENT)
  phoneNumber  String?
  isActive     Boolean         @default(true)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  patient      PatientProfile?
  doctor       DoctorProfile?
  refreshTokens RefreshToken[]

  @@map("users")
}

model DoctorProfile {
  id              String         @id @default(uuid())
  userId          String         @unique
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialtyId     String
  specialty       Specialty      @relation(fields: [specialtyId], references: [id])
  qualifications  String
  experienceYears Int            @default(0)
  consultationFee Float          @default(0.0)
  bio             String
  clinicName      String
  clinicAddress   String
  approvalStatus  ApprovalStatus @default(PENDING)
  createdAt       DateTime       @default(now())
  availabilities  Availability[]
  appointments    Appointment[]

  @@map("doctor_profiles")
}

model Appointment {
  id                 String            @id @default(uuid())
  patientId          String
  patient            PatientProfile    @relation(fields: [patientId], references: [id], onDelete: Cascade)
  doctorId           String
  doctor             DoctorProfile     @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  startAt            DateTime
  endAt              DateTime
  reasonForVisit     String?
  status             AppointmentStatus @default(PENDING)
  cancellationReason String?
  createdAt          DateTime          @default(now())

  @@index([doctorId, startAt, endAt])
  @@map("appointments")
}`,
    },
    'appointments.service.ts': {
      lang: 'typescript',
      path: 'doctor-appointment-scheduler/backend/src/appointments/appointments.service.ts',
      content: `@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, dto: CreateAppointmentDto) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
      include: { availabilities: true },
    });

    if (!doctor || doctor.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new BadRequestException('Doctor is not approved for appointment bookings');
    }

    const startTime = new Date(dto.startAt);
    const dayOfWeek = startTime.getUTCDay();
    const schedule = doctor.availabilities.find(a => a.dayOfWeek === dayOfWeek && a.isActive);

    if (!schedule) {
      throw new BadRequestException('Doctor does not hold office hours on this day');
    }

    const endTime = new Date(startTime.getTime() + (schedule.slotDurationMinutes || 30) * 60000);

    // Concurrency-Safe Atomic Check inside Transaction
    return await this.prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
          AND: [{ startAt: { lt: endTime } }, { endAt: { gt: startTime } }],
        },
      });

      if (conflict) {
        throw new ConflictException('This appointment slot was already reserved. Please select another slot.');
      }

      return tx.appointment.create({
        data: {
          patientId: user.patientId,
          doctorId: doctor.id,
          startAt: startTime,
          endAt: endTime,
          reasonForVisit: dto.reasonForVisit || 'General Consultation',
          status: AppointmentStatus.CONFIRMED,
        },
      });
    });
  }
}`,
    },
    'main.ts': {
      lang: 'typescript',
      path: 'doctor-appointment-scheduler/backend/src/main.ts',
      content: `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Medrella Healthcare Appointment API')
    .setDescription('Production-grade RESTful API for patients, verified medical doctors, and administrators.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 4000);
}
bootstrap();`,
    },
    'docker-compose.yml': {
      lang: 'yaml',
      path: 'doctor-appointment-scheduler/docker-compose.yml',
      content: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: medrella-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: medrella_db
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:`,
    },
    'api.js': {
      lang: 'javascript',
      path: 'doctor-appointment-scheduler/frontend/lib/api.js',
      content: `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchApi(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('medrella_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
    ...options.headers,
  };

  const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Network request failed');
  }
  return data;
}`,
    },
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Full-Stack Monorepo
              </span>
              <span className="rounded bg-indigo-500/30 px-2 py-0.5 text-xs font-mono text-indigo-200">
                doctor-appointment-scheduler/
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              Next.js + NestJS + PostgreSQL Architecture
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl">
              Inspect the source code for the Next.js App Router (JavaScript) frontend, the NestJS (TypeScript + Prisma) backend, Swagger documentation, and cloud deployment configuration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('TREE')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'TREE'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Code Explorer
            </button>
            <button
              onClick={() => setActiveTab('SWAGGER')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'SWAGGER'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Swagger API Docs
            </button>
            <button
              onClick={() => setActiveTab('DEPLOY')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'DEPLOY'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Deployment Guide
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'TREE' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* File Picker */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Folder className="h-4 w-4 text-indigo-600" /> Monorepo Files
            </h3>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase px-2 pt-2">
                Backend (NestJS + Prisma)
              </div>
              <button
                onClick={() => setSelectedFile('schema.prisma')}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                  selectedFile === 'schema.prisma'
                    ? 'bg-indigo-50 font-bold text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Database className="h-3.5 w-3.5 text-indigo-500" />
                <span>prisma/schema.prisma</span>
              </button>
              <button
                onClick={() => setSelectedFile('appointments.service.ts')}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                  selectedFile === 'appointments.service.ts'
                    ? 'bg-indigo-50 font-bold text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileCode className="h-3.5 w-3.5 text-teal-600" />
                <span>appointments.service.ts</span>
              </button>
              <button
                onClick={() => setSelectedFile('main.ts')}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                  selectedFile === 'main.ts'
                    ? 'bg-indigo-50 font-bold text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Server className="h-3.5 w-3.5 text-slate-600" />
                <span>src/main.ts</span>
              </button>
              <button
                onClick={() => setSelectedFile('docker-compose.yml')}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                  selectedFile === 'docker-compose.yml'
                    ? 'bg-indigo-50 font-bold text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Terminal className="h-3.5 w-3.5 text-amber-600" />
                <span>docker-compose.yml</span>
              </button>

              <div className="text-[11px] font-bold text-slate-400 uppercase px-2 pt-4">
                Frontend (Next.js App Router)
              </div>
              <button
                onClick={() => setSelectedFile('api.js')}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                  selectedFile === 'api.js'
                    ? 'bg-indigo-50 font-bold text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileCode className="h-3.5 w-3.5 text-blue-500" />
                <span>frontend/lib/api.js</span>
              </button>
            </div>
          </div>

          {/* Code Display */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-slate-900 p-6 shadow-sm text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="font-mono text-xs text-slate-400">
                {fileContents[selectedFile]?.path}
              </span>
              <button
                onClick={() => handleCopy(fileContents[selectedFile]?.content || '')}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
              <code>{fileContents[selectedFile]?.content}</code>
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'SWAGGER' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">REST API & OpenAPI Specification</h2>
            <p className="text-xs text-slate-500">
              The backend implements strict DTO validation, centralized exceptions, and bearer JWT authentication.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { method: 'POST', path: '/api/auth/register', desc: 'Register a patient or doctor account with hashed passwords' },
              { method: 'POST', path: '/api/auth/login', desc: 'Authenticate credentials and issue JWT bearer token' },
              { method: 'GET', path: '/api/auth/me', desc: 'Retrieve authenticated profile and roles' },
              { method: 'GET', path: '/api/doctors', desc: 'Search and filter approved doctors by specialty' },
              { method: 'GET', path: '/api/doctors/:id/availability', desc: 'Calculate real-time slots and check existing bookings' },
              { method: 'POST', path: '/api/appointments', desc: 'Atomic concurrency booking with duplicate prevention' },
              { method: 'GET', path: '/api/appointments/my', desc: 'Patient appointments feed with upcoming status' },
              { method: 'PATCH', path: '/api/appointments/:id/status', desc: 'Doctor status update (CONFIRMED, COMPLETED, REJECTED)' },
              { method: 'PATCH', path: '/api/appointments/:id/cancel', desc: 'Patient or Doctor appointment cancellation' },
              { method: 'GET', path: '/api/admin/dashboard', desc: 'Platform KPIs, total volume, and recent bookings' },
              { method: 'PATCH', path: '/api/admin/doctors/:id/approval', desc: 'Admin approval or rejection of doctor accounts' },
            ].map((endpoint, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 text-xs">
                <span
                  className={`rounded font-mono font-bold px-2 py-0.5 text-[10px] ${
                    endpoint.method === 'POST'
                      ? 'bg-emerald-100 text-emerald-800'
                      : endpoint.method === 'PATCH'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {endpoint.method}
                </span>
                <span className="font-mono font-semibold text-slate-900">{endpoint.path}</span>
                <span className="text-slate-500 hidden sm:inline">— {endpoint.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'DEPLOY' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Deployment & Production Setup Guide</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <Cloud className="h-5 w-5" /> Next.js Frontend on Vercel
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                1. Connect repository on Vercel.<br />
                2. Set root directory to <code className="bg-slate-100 px-1 rounded">frontend</code>.<br />
                3. Add Environment Variable: <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> pointing to your deployed NestJS backend.<br />
                4. Trigger automatic build and deploy.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <Server className="h-5 w-5" /> NestJS Backend on Render
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                1. Create a Web Service pointing to <code className="bg-slate-100 px-1 rounded">backend</code>.<br />
                2. Build Command: <code className="bg-slate-100 px-1 rounded">npm install && npx prisma generate && npm run build</code>.<br />
                3. Start Command: <code className="bg-slate-100 px-1 rounded">npx prisma migrate deploy && npm run start:prod</code>.<br />
                4. Set <code className="bg-slate-100 px-1 rounded">DATABASE_URL</code> to your hosted PostgreSQL instance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
