import { PrismaClient, Role, ApprovalStatus, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Medrella database for Tirupati & Chennai...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  const patientPassword = await bcrypt.hash('Patient@123', 10);

  // 1. Specialties
  const generalMedicine = await prisma.specialty.upsert({
    where: { name: 'General Medicine' },
    update: {},
    create: {
      name: 'General Medicine',
      description: 'Primary clinical consultations, chronic diabetes, hypertension management, and viral fever care.',
      iconName: 'Stethoscope',
    },
  });

  const cardiology = await prisma.specialty.upsert({
    where: { name: 'Cardiology' },
    update: {},
    create: {
      name: 'Cardiology',
      description: 'Diagnosis and management of cardiovascular conditions, heart health, and preventive echocardiography.',
      iconName: 'HeartPulse',
    },
  });

  const dermatology = await prisma.specialty.upsert({
    where: { name: 'Dermatology' },
    update: {},
    create: {
      name: 'Dermatology',
      description: 'Comprehensive medical and surgical treatment for skin, hair health, acne, and allergies.',
      iconName: 'Sparkles',
    },
  });

  const pediatrics = await prisma.specialty.upsert({
    where: { name: 'Pediatrics' },
    update: {},
    create: {
      name: 'Pediatrics',
      description: 'Compassionate pediatric healthcare, immunization schedules, and developmental assessments.',
      iconName: 'Baby',
    },
  });

  const orthopedics = await prisma.specialty.upsert({
    where: { name: 'Orthopedics' },
    update: {},
    create: {
      name: 'Orthopedics',
      description: 'Surgical and non-surgical care for joint preservation, spine health, and fractures.',
      iconName: 'Activity',
    },
  });

  const gynecology = await prisma.specialty.upsert({
    where: { name: 'Gynecology & Obstetrics' },
    update: {},
    create: {
      name: 'Gynecology & Obstetrics',
      description: 'Comprehensive maternal health, antenatal consultations, and gynecological wellbeing.',
      iconName: 'HeartPulse',
    },
  });

  const ent = await prisma.specialty.upsert({
    where: { name: 'ENT (Ear, Nose, Throat)' },
    update: {},
    create: {
      name: 'ENT (Ear, Nose, Throat)',
      description: 'Treatment for sinus disorders, hearing evaluations, and throat conditions.',
      iconName: 'Stethoscope',
    },
  });

  // 2. Admin User
  await prisma.user.upsert({
    where: { email: 'admin@medrella.com' },
    update: {},
    create: {
      fullName: 'System Administrator',
      email: 'admin@medrella.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      phoneNumber: '+91 877 228 9000',
    },
  });

  // 3. Doctor 1 - Tirupati (Approved Cardiologist)
  const docUser1 = await prisma.user.upsert({
    where: { email: 'dr.jenkins@medrella.com' },
    update: {},
    create: {
      fullName: 'Dr. Sarah Jenkins',
      email: 'dr.jenkins@medrella.com',
      passwordHash: doctorPassword,
      role: Role.DOCTOR,
      phoneNumber: '+91 94401 23456',
    },
  });

  const docProf1 = await prisma.doctorProfile.upsert({
    where: { userId: docUser1.id },
    update: {},
    create: {
      userId: docUser1.id,
      specialtyId: cardiology.id,
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      qualifications: 'MBBS, MD, DM (Cardiology)',
      experienceYears: 14,
      consultationFee: 700.0,
      bio: '[Sample Demo Profile] Consultant interventional cardiologist specializing in preventive heart checkups and hypertension management.',
      clinicName: 'SVIMS Enclave Cardiology Suite',
      clinicAddress: 'Renigunta Road, Near Mahila University, Tirupati, Andhra Pradesh 517502',
      profileImageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Availability for Doctor 1 (Mon-Fri 09:00 - 17:00 IST)
  for (let day = 1; day <= 5; day++) {
    await prisma.availability.create({
      data: {
        doctorId: docProf1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 30,
        isActive: true,
      },
    });
  }

  // 4. Doctor 2 - Chennai (Approved Dermatologist)
  const docUser2 = await prisma.user.upsert({
    where: { email: 'dr.vance@medrella.com' },
    update: {},
    create: {
      fullName: 'Dr. Marcus Vance',
      email: 'dr.vance@medrella.com',
      passwordHash: doctorPassword,
      role: Role.DOCTOR,
      phoneNumber: '+91 98410 34567',
    },
  });

  const docProf2 = await prisma.doctorProfile.upsert({
    where: { userId: docUser2.id },
    update: {},
    create: {
      userId: docUser2.id,
      specialtyId: dermatology.id,
      city: 'Chennai',
      state: 'Tamil Nadu',
      qualifications: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
      experienceYears: 11,
      consultationFee: 650.0,
      bio: '[Sample Demo Profile] Specialist in clinical dermatology, acne therapies, and allergic skin conditions.',
      clinicName: 'ClearSkin Clinical Dermatology',
      clinicAddress: '42 Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006',
      profileImageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  for (let day = 1; day <= 5; day++) {
    await prisma.availability.create({
      data: {
        doctorId: docProf2.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 30,
        isActive: true,
      },
    });
  }

  // 5. Doctor 3 - Tirupati (Pending Approval for testing Admin workflows)
  const docUser3 = await prisma.user.upsert({
    where: { email: 'dr.patel@medrella.com' },
    update: {},
    create: {
      fullName: 'Dr. Liam Patel',
      email: 'dr.patel@medrella.com',
      passwordHash: doctorPassword,
      role: Role.DOCTOR,
      phoneNumber: '+91 94411 67890',
    },
  });

  await prisma.doctorProfile.upsert({
    where: { userId: docUser3.id },
    update: {},
    create: {
      userId: docUser3.id,
      specialtyId: pediatrics.id,
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      qualifications: 'MBBS, DCH, DNB (Pediatrics)',
      experienceYears: 7,
      consultationFee: 500.0,
      bio: '[Sample Demo Profile] Child health specialist offering compassionate newborn assessments and immunization.',
      clinicName: 'Balaji Child Wellness Clinic',
      clinicAddress: 'Prakasam Road, Near RTC Bus Stand, Tirupati, Andhra Pradesh 517501',
      profileImageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
      approvalStatus: ApprovalStatus.PENDING,
    },
  });

  // 6. Patient User
  const patientUser = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      fullName: 'Johnathan Doe',
      email: 'john.doe@example.com',
      passwordHash: patientPassword,
      role: Role.PATIENT,
      phoneNumber: '+91 98480 11223',
    },
  });

  const patientProf = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      dateOfBirth: '1988-06-14',
      gender: 'Male',
      address: 'Balaji Colony, Beside SV University Gate, Tirupati, Andhra Pradesh 517502',
      emergencyContact: 'Lakshmi Doe (+91 98480 99887)',
    },
  });

  // 7. Sample Appointment in IST
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 30);

  await prisma.appointment.create({
    data: {
      patientId: patientProf.id,
      doctorId: docProf1.id,
      startAt: tomorrow,
      endAt: tomorrowEnd,
      reasonForVisit: 'Annual cardiovascular checkup and ECG evaluation.',
      status: AppointmentStatus.CONFIRMED,
    },
  });

  console.log('Seeding completed successfully for Tirupati & Chennai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
