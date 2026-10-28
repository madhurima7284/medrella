import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  city?: 'Tirupati' | 'Chennai';
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialtyId: string;
  city: 'Tirupati' | 'Chennai';
  state: 'Andhra Pradesh' | 'Tamil Nadu';
  qualifications: string;
  experienceYears: number;
  consultationFee: number; // in INR (₹)
  bio: string;
  clinicName: string;
  clinicAddress: string;
  profileImageUrl?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface Availability {
  id: string;
  doctorId: string; // references doctorProfiles.id
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // HH:mm format e.g. "09:00"
  endTime: string; // HH:mm format e.g. "17:00"
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  patientId: string; // references patientProfiles.id
  doctorId: string; // references doctorProfiles.id
  startAt: string; // ISO UTC string (rendered in IST)
  endAt: string; // ISO UTC string
  reasonForVisit?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'COMPLETED';
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revoked: boolean;
}

export interface DatabaseSchema {
  users: User[];
  patientProfiles: PatientProfile[];
  doctorProfiles: DoctorProfile[];
  specialties: Specialty[];
  availabilities: Availability[];
  appointments: Appointment[];
  refreshTokens: RefreshToken[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'medrella-db.json');

let memoryDb: DatabaseSchema | null = null;

function ensureDataDir() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getInitialSeedData(): DatabaseSchema {
  const now = new Date();
  const salt = bcrypt.genSaltSync(10);
  const defaultAdminPasswordHash = bcrypt.hashSync('Admin@123', salt);
  const defaultDoctorPasswordHash = bcrypt.hashSync('Doctor@123', salt);
  const defaultPatientPasswordHash = bcrypt.hashSync('Patient@123', salt);

  const specialties: Specialty[] = [
    {
      id: 'spec-gen',
      name: 'General Medicine',
      description: 'Primary medical care, seasonal fever, hypertension, diabetes, and preventive health screenings.',
      iconName: 'Stethoscope',
    },
    {
      id: 'spec-cardio',
      name: 'Cardiology',
      description: 'Diagnosis and management of cardiovascular conditions, heart disease, ECG, and blood pressure.',
      iconName: 'HeartPulse',
    },
    {
      id: 'spec-derma',
      name: 'Dermatology',
      description: 'Clinical care for skin conditions, allergy management, hair fall, and dermatologic wellness.',
      iconName: 'Sparkles',
    },
    {
      id: 'spec-pedia',
      name: 'Pediatrics',
      description: 'Comprehensive health monitoring, newborn care, vaccinations, and pediatric development.',
      iconName: 'Baby',
    },
    {
      id: 'spec-ortho',
      name: 'Orthopedics',
      description: 'Bone, joint, and spine healthcare, arthritis management, and sports trauma evaluation.',
      iconName: 'Activity',
    },
    {
      id: 'spec-gyn',
      name: 'Gynecology & Obstetrics',
      description: 'Women healthcare, prenatal consultations, maternity guidance, and hormonal health.',
      iconName: 'Users',
    },
    {
      id: 'spec-ent',
      name: 'ENT (Ear, Nose, Throat)',
      description: 'Treatment for sinus disorders, throat discomfort, hearing evaluation, and allergies.',
      iconName: 'Stethoscope',
    },
    {
      id: 'spec-ophthal',
      name: 'Ophthalmology',
      description: 'Vision testing, eye examinations, cataract evaluation, and retinal health consultations.',
      iconName: 'Sparkles',
    },
    {
      id: 'spec-dental',
      name: 'Dentistry',
      description: 'Dental checkups, cavity restoration, oral hygiene, and preventive orthodontics.',
      iconName: 'Activity',
    },
  ];

  const users: User[] = [
    {
      id: 'usr-admin-1',
      fullName: 'System Administrator',
      email: 'admin@medrella.com',
      passwordHash: defaultAdminPasswordHash,
      role: 'ADMIN',
      phoneNumber: '+91 877 228 9000',
      isActive: true,
      createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    // Doctor 1 - Tirupati (Cardiologist)
    {
      id: 'usr-doc-1',
      fullName: 'Dr. Sarah Jenkins',
      email: 'dr.jenkins@medrella.com',
      passwordHash: defaultDoctorPasswordHash,
      role: 'DOCTOR',
      phoneNumber: '+91 94401 23456',
      isActive: true,
      createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    // Doctor 2 - Chennai (Dermatologist)
    {
      id: 'usr-doc-2',
      fullName: 'Dr. Marcus Vance',
      email: 'dr.vance@medrella.com',
      passwordHash: defaultDoctorPasswordHash,
      role: 'DOCTOR',
      phoneNumber: '+91 98410 34567',
      isActive: true,
      createdAt: new Date(now.getTime() - 50 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    // Doctor 3 - Tirupati (General Medicine)
    {
      id: 'usr-doc-3',
      fullName: 'Dr. K. Venkat Rao',
      email: 'dr.venkatrao@medrella.com',
      passwordHash: defaultDoctorPasswordHash,
      role: 'DOCTOR',
      phoneNumber: '+91 98492 56789',
      isActive: true,
      createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    // Doctor 4 - Tirupati (Pediatrician - Pending Approval for admin test workflow)
    {
      id: 'usr-doc-4',
      fullName: 'Dr. Liam Patel',
      email: 'dr.patel@medrella.com',
      passwordHash: defaultDoctorPasswordHash,
      role: 'DOCTOR',
      phoneNumber: '+91 94411 67890',
      isActive: true,
      createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    // Doctor 5 - Chennai (Orthopedics)
    {
      id: 'usr-doc-5',
      fullName: 'Dr. S. Sundararajan',
      email: 'dr.sundar@medrella.com',
      passwordHash: defaultDoctorPasswordHash,
      role: 'DOCTOR',
      phoneNumber: '+91 98840 78901',
      isActive: true,
      createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    // Doctor 6 - Tirupati (Gynecology & Obstetrics)
    {
      id: 'usr-doc-6',
      fullName: 'Dr. V. Radhika',
      email: 'dr.radhika@medrella.com',
      passwordHash: defaultDoctorPasswordHash,
      role: 'DOCTOR',
      phoneNumber: '+91 94900 89012',
      isActive: true,
      createdAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    // Doctor 7 - Chennai (ENT)
    {
      id: 'usr-doc-7',
      fullName: 'Dr. R. Karthik',
      email: 'dr.karthik@medrella.com',
      passwordHash: defaultDoctorPasswordHash,
      role: 'DOCTOR',
      phoneNumber: '+91 98402 90123',
      isActive: true,
      createdAt: new Date(now.getTime() - 35 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    // Patients
    {
      id: 'usr-pat-1',
      fullName: 'Johnathan Doe',
      email: 'john.doe@example.com',
      passwordHash: defaultPatientPasswordHash,
      role: 'PATIENT',
      phoneNumber: '+91 98480 11223',
      isActive: true,
      createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'usr-pat-2',
      fullName: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      passwordHash: defaultPatientPasswordHash,
      role: 'PATIENT',
      phoneNumber: '+91 94440 33445',
      isActive: true,
      createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'usr-pat-demo',
      fullName: 'Anitha Sharma',
      email: 'anitha.sharma@example.com',
      passwordHash: defaultPatientPasswordHash,
      role: 'PATIENT',
      phoneNumber: '+91 98490 55667',
      isActive: true,
      createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const doctorProfiles: DoctorProfile[] = [
    {
      id: 'doc-prof-1',
      userId: 'usr-doc-1',
      specialtyId: 'spec-cardio',
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      qualifications: 'MBBS, MD, DM (Cardiology)',
      experienceYears: 14,
      consultationFee: 700,
      bio: '[Sample Demo Profile] Consultant interventional cardiologist specializing in preventive heart checkups, hypertension management, echocardiography, and lipid control.',
      clinicName: 'SVIMS Enclave Cardiology Suite',
      clinicAddress: 'Renigunta Road, Near Mahila University, Tirupati, Andhra Pradesh 517502',
      profileImageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      approvalStatus: 'APPROVED',
      createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'doc-prof-2',
      userId: 'usr-doc-2',
      specialtyId: 'spec-derma',
      city: 'Chennai',
      state: 'Tamil Nadu',
      qualifications: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
      experienceYears: 11,
      consultationFee: 650,
      bio: '[Sample Demo Profile] Specialist in clinical dermatology, acne therapies, allergic skin conditions, laser procedures, and pediatric skin care.',
      clinicName: 'ClearSkin Clinical Dermatology',
      clinicAddress: '42 Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006',
      profileImageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      approvalStatus: 'APPROVED',
      createdAt: new Date(now.getTime() - 50 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'doc-prof-3',
      userId: 'usr-doc-3',
      specialtyId: 'spec-gen',
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      qualifications: 'MBBS, MD (General Medicine)',
      experienceYears: 18,
      consultationFee: 450,
      bio: '[Sample Demo Profile] Senior physician providing comprehensive primary medical care, chronic diabetes monitoring, viral illness management, and geriatric care.',
      clinicName: 'Alipiri Health & Medical Clinic',
      clinicAddress: 'Balaji Colony, Beside Syndicate Bank, Tirupati, Andhra Pradesh 517501',
      profileImageUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
      approvalStatus: 'APPROVED',
      createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'doc-prof-4',
      userId: 'usr-doc-4',
      specialtyId: 'spec-pedia',
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      qualifications: 'MBBS, DCH, DNB (Pediatrics)',
      experienceYears: 7,
      consultationFee: 500,
      bio: '[Sample Demo Profile] Child health specialist offering compassionate newborn assessments, developmental screening, and routine childhood immunizations.',
      clinicName: 'Balaji Child Health Clinic',
      clinicAddress: 'Air Bypass Road, Near Annamaiah Circle, Tirupati, Andhra Pradesh 517501',
      profileImageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
      approvalStatus: 'PENDING', // Pending to allow demonstrating admin approval workflow
      createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'doc-prof-5',
      userId: 'usr-doc-5',
      specialtyId: 'spec-ortho',
      city: 'Chennai',
      state: 'Tamil Nadu',
      qualifications: 'MBBS, MS (Orthopedics), MCh',
      experienceYears: 16,
      consultationFee: 800,
      bio: '[Sample Demo Profile] Orthopedic surgeon with extensive clinical focus on joint preservation, sports ligament injuries, knee arthritis, and spine rehabilitation.',
      clinicName: 'Apex Bone & Joint Specialty Centre',
      clinicAddress: '15 2nd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040',
      profileImageUrl: 'https://images.unsplash.com/photo-1594824813633-4f901a1c3248?auto=format&fit=crop&q=80&w=400',
      approvalStatus: 'APPROVED',
      createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'doc-prof-6',
      userId: 'usr-doc-6',
      specialtyId: 'spec-gyn',
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      qualifications: 'MBBS, MS (Obstetrics & Gynecology), DGO',
      experienceYears: 13,
      consultationFee: 550,
      bio: '[Sample Demo Profile] Senior obstetrician and gynecologist committed to women health, prenatal guidance, PCOS care, and wellness throughout motherhood.',
      clinicName: 'Sree Venkateswara Women Healthcare',
      clinicAddress: 'Prakasam Road, Near RTC Bus Stand, Tirupati, Andhra Pradesh 517501',
      profileImageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      approvalStatus: 'APPROVED',
      createdAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'doc-prof-7',
      userId: 'usr-doc-7',
      specialtyId: 'spec-ent',
      city: 'Chennai',
      state: 'Tamil Nadu',
      qualifications: 'MBBS, MS (ENT), DNB',
      experienceYears: 12,
      consultationFee: 600,
      bio: '[Sample Demo Profile] ENT surgeon specializing in endoscopic sinus diagnosis, allergy testing, chronic ear complaints, and voice care.',
      clinicName: 'Metro ENT & Hearing Clinic',
      clinicAddress: '88 Usman Road, T. Nagar, Chennai, Tamil Nadu 600017',
      profileImageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      approvalStatus: 'APPROVED',
      createdAt: new Date(now.getTime() - 35 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const patientProfiles: PatientProfile[] = [
    {
      id: 'pat-prof-1',
      userId: 'usr-pat-1',
      dateOfBirth: '1988-06-14',
      gender: 'Male',
      address: 'Plot 45, Korlagunta Main Road, Tirupati, Andhra Pradesh 517501',
      emergencyContact: 'S. Rao (+91 98480 11999, Brother)',
      city: 'Tirupati',
    },
    {
      id: 'pat-prof-2',
      userId: 'usr-pat-2',
      dateOfBirth: '1992-11-20',
      gender: 'Male',
      address: '12 Gandhi Road, Velachery, Chennai, Tamil Nadu 600042',
      emergencyContact: 'K. Priya (+91 94440 88776, Spouse)',
      city: 'Chennai',
    },
    {
      id: 'pat-prof-demo',
      userId: 'usr-pat-demo',
      dateOfBirth: '1990-04-12',
      gender: 'Female',
      address: '77 Prakasam Road, Tirupati, Andhra Pradesh 517501',
      emergencyContact: 'R. Sharma (+91 98490 12345, Father)',
      city: 'Tirupati',
    },
  ];

  // Availabilities: Mon-Sat schedule (IST: 09:30 to 13:00, 16:30 to 20:00 typical in Indian clinics)
  const availabilities: Availability[] = [];
  const doctorIds = [
    'doc-prof-1',
    'doc-prof-2',
    'doc-prof-3',
    'doc-prof-4',
    'doc-prof-5',
    'doc-prof-6',
    'doc-prof-7',
  ];

  doctorIds.forEach((docId) => {
    // Mon - Sat schedule
    for (let day = 1; day <= 6; day++) {
      availabilities.push({
        id: `avail-${docId}-${day}`,
        doctorId: docId,
        dayOfWeek: day,
        startTime: '09:30',
        endTime: '18:30',
        slotDurationMinutes: 30,
        isActive: true,
      });
    }
  });

  // Calculate upcoming and past appointment dates in IST
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 30, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 30);

  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(16, 0, 0, 0);

  const dayAfterTomorrowEnd = new Date(dayAfterTomorrow);
  dayAfterTomorrowEnd.setMinutes(dayAfterTomorrowEnd.getMinutes() + 30);

  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - 4);
  pastDate.setHours(11, 0, 0, 0);

  const pastDateEnd = new Date(pastDate);
  pastDateEnd.setMinutes(pastDateEnd.getMinutes() + 30);

  const appointments: Appointment[] = [
    {
      id: 'apt-seed-1',
      patientId: 'pat-prof-demo',
      doctorId: 'doc-prof-1', // Dr. Sarah Jenkins (Tirupati)
      startAt: tomorrow.toISOString(),
      endAt: tomorrowEnd.toISOString(),
      reasonForVisit: 'Hypertension checkup and follow-up ECG review.',
      status: 'CONFIRMED',
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: 'apt-seed-2',
      patientId: 'pat-prof-demo',
      doctorId: 'doc-prof-3', // Dr. K. Venkat Rao (Tirupati)
      startAt: dayAfterTomorrow.toISOString(),
      endAt: dayAfterTomorrowEnd.toISOString(),
      reasonForVisit: 'Seasonal fever and routine blood sugar evaluation.',
      status: 'PENDING',
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: 'apt-seed-3',
      patientId: 'pat-prof-demo',
      doctorId: 'doc-prof-6', // Dr. V. Radhika (Tirupati)
      startAt: pastDate.toISOString(),
      endAt: pastDateEnd.toISOString(),
      reasonForVisit: 'Annual health check and blood pressure evaluation.',
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
      updatedAt: pastDate.toISOString(),
    },
  ];

  return {
    users,
    patientProfiles,
    doctorProfiles,
    specialties,
    availabilities,
    appointments,
    refreshTokens: [],
  };
}

export function getDb(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }
  ensureDataDir();
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      // Check if data is already migrated to India (city field exists on doctors)
      if (parsed.doctorProfiles && parsed.doctorProfiles[0]?.city) {
        memoryDb = parsed;
        return memoryDb!;
      }
    } catch (err) {
      console.error('Failed to parse database file, re-seeding:', err);
    }
  }
  memoryDb = getInitialSeedData();
  saveDb(memoryDb);
  return memoryDb;
}

export function saveDb(data?: DatabaseSchema) {
  if (data) {
    memoryDb = data;
  }
  if (!memoryDb) return;
  ensureDataDir();

  const tempPath = `${DB_FILE_PATH}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(memoryDb, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE_PATH);
  } catch (err) {
    console.error('Failed to write database file atomically:', err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {
      // ignore cleanup error
    }
  }
}

export function resetDatabase() {
  memoryDb = getInitialSeedData();
  saveDb(memoryDb);
  return memoryDb;
}
