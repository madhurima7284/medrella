import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  getDb,
  saveDb,
  resetDatabase,
  User,
  DoctorProfile,
  PatientProfile,
  Appointment,
  Availability,
  Specialty,
} from './db.ts';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'medrella-dev-secret-jwt-key-2026';
const JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'medrella-dev-refresh-secret-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    fullName: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
      fullName: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
}

export function roleGuard(roles: Array<'PATIENT' | 'DOCTOR' | 'ADMIN'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient role permissions' });
    }
    next();
  };
}

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION MODULE
// ==========================================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      password,
      role = 'PATIENT',
      phoneNumber,
      // Optional Doctor profile fields
      specialtyId,
      qualifications,
      experienceYears,
      consultationFee,
      bio,
      clinicName,
      clinicAddress,
      profileImageUrl,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    if (role === 'ADMIN') {
      return res.status(400).json({ message: 'Public registration for ADMIN role is strictly forbidden' });
    }

    if (role !== 'PATIENT' && role !== 'DOCTOR') {
      return res.status(400).json({ message: 'Invalid role specified. Must be PATIENT or DOCTOR' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const db = getDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newUser: User = {
      id: userId,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      phoneNumber: phoneNumber?.trim() || '',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.users.push(newUser);

    let profile: any = null;

    if (role === 'PATIENT') {
      const patientProf: PatientProfile = {
        id: `pat-prof-${Date.now()}`,
        userId: newUser.id,
      };
      db.patientProfiles.push(patientProf);
      profile = patientProf;
    } else if (role === 'DOCTOR') {
      const { city: docCity, state: docState } = req.body;
      const resolvedCity: 'Tirupati' | 'Chennai' = docCity === 'Chennai' ? 'Chennai' : 'Tirupati';
      const resolvedState: 'Andhra Pradesh' | 'Tamil Nadu' = resolvedCity === 'Chennai' ? 'Tamil Nadu' : 'Andhra Pradesh';
      const defaultSpecId = specialtyId || (db.specialties[0] ? db.specialties[0].id : 'spec-gen');
      const doctorProf: DoctorProfile = {
        id: `doc-prof-${Date.now()}`,
        userId: newUser.id,
        specialtyId: defaultSpecId,
        city: resolvedCity,
        state: docState || resolvedState,
        qualifications: qualifications?.trim() || 'MBBS, MD',
        experienceYears: Number(experienceYears) || 5,
        consultationFee: Number(consultationFee) || 500,
        bio: bio?.trim() || '[Sample Demo Profile] Medical doctor practicing in Andhra Pradesh and Tamil Nadu.',
        clinicName: clinicName?.trim() || (resolvedCity === 'Chennai' ? 'Apollo Specialty Clinic' : 'Balaji Medical Clinic'),
        clinicAddress: clinicAddress?.trim() || (resolvedCity === 'Chennai' ? 'Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006' : 'Balaji Colony, Tirupati, Andhra Pradesh 517501'),
        profileImageUrl: profileImageUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
        approvalStatus: 'PENDING', // New doctor registrations require admin approval
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.doctorProfiles.push(doctorProf);

      // Initialize default availability (Mon - Fri 09:00 - 17:00, 30 min)
      for (let day = 1; day <= 5; day++) {
        db.availabilities.push({
          id: `avail-${doctorProf.id}-${day}`,
          doctorId: doctorProf.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 30,
          isActive: true,
        });
      }
      profile = doctorProf;
    }

    saveDb();

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = newUser;

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userSafe,
      profile,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let profile: any = null;
    if (user.role === 'PATIENT') {
      profile = db.patientProfiles.find((p) => p.userId === user.id) || null;
    } else if (user.role === 'DOCTOR') {
      profile = db.doctorProfiles.find((d) => d.userId === user.id) || null;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: userSafe,
      profile,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.user?.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let profile: any = null;
  if (user.role === 'PATIENT') {
    profile = db.patientProfiles.find((p) => p.userId === user.id) || null;
  } else if (user.role === 'DOCTOR') {
    const docProfile = db.doctorProfiles.find((d) => d.userId === user.id);
    if (docProfile) {
      const specialty = db.specialties.find((s) => s.id === docProfile.specialtyId);
      const availabilities = db.availabilities.filter((a) => a.doctorId === docProfile.id);
      profile = { ...docProfile, specialty, availabilities };
    }
  }

  const { passwordHash: _, ...userSafe } = user;
  return res.json({ user: userSafe, profile });
});

apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

// ==========================================
// 2. DOCTOR DIRECTORY & PROFILES MODULE
// ==========================================

apiRouter.get('/doctors', (req: Request, res: Response) => {
  const db = getDb();
  const { search, specialtyId, status = 'APPROVED', city } = req.query;

  let doctors = db.doctorProfiles.map((doc) => {
    const user = db.users.find((u) => u.id === doc.userId);
    const specialty = db.specialties.find((s) => s.id === doc.specialtyId);
    return {
      ...doc,
      user: user ? { id: user.id, fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber, isActive: user.isActive } : null,
      specialty,
    };
  });

  // Filter by approval status
  if (status && status !== 'ALL') {
    doctors = doctors.filter((d) => d.approvalStatus === status);
  }

  // Filter by city
  if (city && city !== 'ALL') {
    doctors = doctors.filter((d) => d.city?.toLowerCase() === (city as string).toLowerCase());
  }

  // Filter by specialty
  if (specialtyId && specialtyId !== 'ALL') {
    doctors = doctors.filter((d) => d.specialtyId === specialtyId);
  }

  // Search filter
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    doctors = doctors.filter(
      (d) =>
        d.user?.fullName.toLowerCase().includes(q) ||
        d.specialty?.name.toLowerCase().includes(q) ||
        d.clinicName.toLowerCase().includes(q) ||
        d.qualifications.toLowerCase().includes(q) ||
        d.bio.toLowerCase().includes(q)
    );
  }

  return res.json(doctors);
});

apiRouter.get('/doctors/:id', (req: Request, res: Response) => {
  const db = getDb();
  const doc = db.doctorProfiles.find((d) => d.id === req.params.id);

  if (!doc) {
    return res.status(404).json({ message: 'Doctor profile not found' });
  }

  const user = db.users.find((u) => u.id === doc.userId);
  const specialty = db.specialties.find((s) => s.id === doc.specialtyId);
  const availabilities = db.availabilities.filter((a) => a.doctorId === doc.id);

  return res.json({
    ...doc,
    user: user ? { id: user.id, fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber } : null,
    specialty,
    availabilities,
  });
});

// Calculate real-time dynamic available slots for a doctor on a specific date
apiRouter.get('/doctors/:id/availability', (req: Request, res: Response) => {
  const db = getDb();
  const doctorId = req.params.id;
  const dateStr = req.query.date as string; // Expects YYYY-MM-DD

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ message: 'Invalid or missing date parameter. Format: YYYY-MM-DD' });
  }

  const doc = db.doctorProfiles.find((d) => d.id === doctorId);
  if (!doc) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  if (doc.approvalStatus !== 'APPROVED') {
    return res.status(403).json({ message: 'Doctor is not currently approved for bookings' });
  }

  // Parse target date and day of week
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 1 is Monday ...

  // Find doctor's availability configuration for this day of week
  const schedule = db.availabilities.find(
    (a) => a.doctorId === doctorId && a.dayOfWeek === dayOfWeek && a.isActive
  );

  if (!schedule) {
    return res.json({
      doctorId,
      date: dateStr,
      dayOfWeek,
      isAvailableDay: false,
      message: 'Doctor does not hold office hours on this day',
      slots: [],
    });
  }

  // Parse start and end hours
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const slotDuration = schedule.slotDurationMinutes || 30;

  // Find all active appointments for this doctor on this date
  const existingAppointments = db.appointments.filter((apt) => {
    if (apt.doctorId !== doctorId) return false;
    if (apt.status === 'CANCELLED' || apt.status === 'REJECTED') return false;
    // Check if startAt date matches target date
    const aptDate = apt.startAt.split('T')[0];
    return aptDate === dateStr;
  });

  const slots = [];
  const currentSlotTime = new Date(year, month - 1, day, startH, startM, 0, 0);
  const endTime = new Date(year, month - 1, day, endH, endM, 0, 0);

  const now = new Date();

  while (currentSlotTime < endTime) {
    const slotStart = new Date(currentSlotTime);
    const slotEnd = new Date(currentSlotTime.getTime() + slotDuration * 60000);

    if (slotEnd > endTime) break;

    const startIso = slotStart.toISOString();
    const endIso = slotEnd.toISOString();
    const timeFormatted = slotStart.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Check if slot overlaps any existing active appointment
    const isBooked = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.startAt).getTime();
      const aptEnd = new Date(apt.endAt).getTime();
      const slotStartTime = slotStart.getTime();
      const slotEndTime = slotEnd.getTime();
      return Math.max(slotStartTime, aptStart) < Math.min(slotEndTime, aptEnd);
    });

    const isPast = slotStart.getTime() < now.getTime();

    slots.push({
      time: timeFormatted,
      startAt: startIso,
      endAt: endIso,
      available: !isBooked && !isPast,
      isBooked,
      isPast,
    });

    currentSlotTime.setMinutes(currentSlotTime.getMinutes() + slotDuration);
  }

  return res.json({
    doctorId,
    date: dateStr,
    dayOfWeek,
    isAvailableDay: true,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    slotDurationMinutes: slotDuration,
    slots,
  });
});

// Update Doctor profile
apiRouter.patch('/doctors/me/profile', authMiddleware, roleGuard(['DOCTOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const doc = db.doctorProfiles.find((d) => d.userId === req.user?.id);
  if (!doc) {
    return res.status(404).json({ message: 'Doctor profile not found' });
  }

  const {
    specialtyId,
    qualifications,
    experienceYears,
    consultationFee,
    bio,
    clinicName,
    clinicAddress,
    profileImageUrl,
    phoneNumber,
    fullName,
  } = req.body;

  if (specialtyId) doc.specialtyId = specialtyId;
  if (qualifications !== undefined) doc.qualifications = qualifications;
  if (experienceYears !== undefined) doc.experienceYears = Number(experienceYears);
  if (consultationFee !== undefined) doc.consultationFee = Number(consultationFee);
  if (bio !== undefined) doc.bio = bio;
  if (clinicName !== undefined) doc.clinicName = clinicName;
  if (clinicAddress !== undefined) doc.clinicAddress = clinicAddress;
  if (profileImageUrl !== undefined) doc.profileImageUrl = profileImageUrl;
  doc.updatedAt = new Date().toISOString();

  // Also update user record if name or phone changed
  const user = db.users.find((u) => u.id === req.user?.id);
  if (user) {
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    user.updatedAt = new Date().toISOString();
  }

  saveDb();
  return res.json({ message: 'Profile updated successfully', profile: doc });
});

// Doctor availability management
apiRouter.patch('/doctors/me/availability', authMiddleware, roleGuard(['DOCTOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const doc = db.doctorProfiles.find((d) => d.userId === req.user?.id);
  if (!doc) {
    return res.status(404).json({ message: 'Doctor profile not found' });
  }

  const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime, slotDurationMinutes, isActive }

  if (!Array.isArray(schedules)) {
    return res.status(400).json({ message: 'schedules must be an array of schedule items' });
  }

  // Remove existing availabilities for this doctor and insert new ones
  db.availabilities = db.availabilities.filter((a) => a.doctorId !== doc.id);

  schedules.forEach((s) => {
    db.availabilities.push({
      id: `avail-${doc.id}-${s.dayOfWeek}`,
      doctorId: doc.id,
      dayOfWeek: Number(s.dayOfWeek),
      startTime: s.startTime || '09:00',
      endTime: s.endTime || '17:00',
      slotDurationMinutes: Number(s.slotDurationMinutes) || 30,
      isActive: s.isActive ?? true,
    });
  });

  saveDb();
  return res.json({
    message: 'Schedule and working hours saved successfully',
    availabilities: db.availabilities.filter((a) => a.doctorId === doc.id),
  });
});

// ==========================================
// 3. SPECIALTIES MODULE
// ==========================================

apiRouter.get('/specialties', (_req: Request, res: Response) => {
  const db = getDb();
  const list = db.specialties.map((s) => {
    const doctorCount = db.doctorProfiles.filter((d) => d.specialtyId === s.id && d.approvalStatus === 'APPROVED').length;
    return { ...s, doctorCount };
  });
  return res.json(list);
});

apiRouter.post('/admin/specialties', authMiddleware, roleGuard(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, description, iconName = 'Stethoscope' } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Specialty name is required' });
  }

  const db = getDb();
  if (db.specialties.some((s) => s.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ message: 'A specialty with this name already exists' });
  }

  const newSpec: Specialty = {
    id: `spec-${Date.now()}`,
    name: name.trim(),
    description: description?.trim() || '',
    iconName,
  };

  db.specialties.push(newSpec);
  saveDb();
  return res.status(201).json(newSpec);
});

apiRouter.patch('/admin/specialties/:id', authMiddleware, roleGuard(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const spec = db.specialties.find((s) => s.id === req.params.id);
  if (!spec) {
    return res.status(404).json({ message: 'Specialty not found' });
  }

  const { name, description, iconName } = req.body;
  if (name) spec.name = name.trim();
  if (description !== undefined) spec.description = description.trim();
  if (iconName) spec.iconName = iconName;

  saveDb();
  return res.json(spec);
});

apiRouter.delete('/admin/specialties/:id', authMiddleware, roleGuard(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const index = db.specialties.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Specialty not found' });
  }

  // Check if any doctors reference this specialty
  const hasDoctors = db.doctorProfiles.some((d) => d.specialtyId === req.params.id);
  if (hasDoctors) {
    return res.status(400).json({ message: 'Cannot delete specialty because doctors are assigned to it' });
  }

  db.specialties.splice(index, 1);
  saveDb();
  return res.json({ message: 'Specialty deleted successfully' });
});

// ==========================================
// 4. APPOINTMENT BOOKING MODULE
// ==========================================

apiRouter.post('/appointments', authMiddleware, roleGuard(['PATIENT']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { doctorId, startAt, reasonForVisit } = req.body;

    if (!doctorId || !startAt) {
      return res.status(400).json({ message: 'doctorId and startAt timestamp are required' });
    }

    const db = getDb();

    // 1. Resolve Patient Profile
    let patient = db.patientProfiles.find((p) => p.userId === req.user?.id);
    if (!patient) {
      patient = {
        id: `pat-prof-${Date.now()}`,
        userId: req.user!.id,
      };
      db.patientProfiles.push(patient);
    }

    // 2. Validate Doctor
    const doctor = db.doctorProfiles.find((d) => d.id === doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.approvalStatus !== 'APPROVED') {
      return res.status(400).json({ message: 'This doctor is not approved to take appointments' });
    }

    const doctorUser = db.users.find((u) => u.id === doctor.userId);
    if (!doctorUser || !doctorUser.isActive) {
      return res.status(400).json({ message: 'Doctor account is inactive' });
    }

    // 3. Validate Date & Time
    const startTime = new Date(startAt);
    if (isNaN(startTime.getTime())) {
      return res.status(400).json({ message: 'Invalid startAt date timestamp' });
    }

    const now = new Date();
    if (startTime.getTime() < now.getTime()) {
      return res.status(400).json({ message: 'Cannot book appointments in the past' });
    }

    // 4. Check Doctor's Availability Schedule
    const dayOfWeek = startTime.getDay();
    const schedule = db.availabilities.find(
      (a) => a.doctorId === doctorId && a.dayOfWeek === dayOfWeek && a.isActive
    );

    if (!schedule) {
      return res.status(400).json({ message: 'Doctor is not available on this day of the week' });
    }

    const slotDuration = schedule.slotDurationMinutes || 30;
    const endTime = new Date(startTime.getTime() + slotDuration * 60000);

    // 5. ATOMIC CONCURRENCY CHECK: Prevent Overlapping Bookings for the Doctor
    const doctorConflict = db.appointments.some((apt) => {
      if (apt.doctorId !== doctorId) return false;
      if (apt.status === 'CANCELLED' || apt.status === 'REJECTED') return false;

      const existingStart = new Date(apt.startAt).getTime();
      const existingEnd = new Date(apt.endAt).getTime();
      const newStart = startTime.getTime();
      const newEnd = endTime.getTime();

      return Math.max(existingStart, newStart) < Math.min(existingEnd, newEnd);
    });

    if (doctorConflict) {
      return res.status(409).json({
        message: 'This time slot was just booked by another patient. Please select another slot.',
      });
    }

    // 6. Check Patient Overlap: Prevent same patient from double-booking themselves
    const patientConflict = db.appointments.some((apt) => {
      if (apt.patientId !== patient!.id) return false;
      if (apt.status === 'CANCELLED' || apt.status === 'REJECTED') return false;

      const existingStart = new Date(apt.startAt).getTime();
      const existingEnd = new Date(apt.endAt).getTime();
      const newStart = startTime.getTime();
      const newEnd = endTime.getTime();

      return Math.max(existingStart, newStart) < Math.min(existingEnd, newEnd);
    });

    if (patientConflict) {
      return res.status(409).json({
        message: 'You already have another active appointment scheduled during this time interval.',
      });
    }

    // 7. Create Appointment Record
    const appointmentId = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newAppointment: Appointment = {
      id: appointmentId,
      patientId: patient.id,
      doctorId: doctor.id,
      startAt: startTime.toISOString(),
      endAt: endTime.toISOString(),
      reasonForVisit: reasonForVisit?.trim() || 'General Consultation',
      status: 'CONFIRMED', // Confirmed booking for patient convenience
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.appointments.push(newAppointment);
    saveDb();

    const specialty = db.specialties.find((s) => s.id === doctor.specialtyId);

    return res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        ...newAppointment,
        doctor: {
          ...doctor,
          user: doctorUser ? { fullName: doctorUser.fullName, email: doctorUser.email, phoneNumber: doctorUser.phoneNumber } : null,
          specialty,
        },
        patient: {
          ...patient,
          user: { fullName: req.user!.fullName, email: req.user!.email },
        },
      },
    });
  } catch (error: any) {
    console.error('Booking appointment error:', error);
    return res.status(500).json({ message: 'Internal server error during appointment booking' });
  }
});

// Patient gets their own appointments
apiRouter.get('/appointments/my', authMiddleware, roleGuard(['PATIENT']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  let patient = db.patientProfiles.find((p) => p.userId === req.user?.id);

  if (!patient) {
    patient = {
      id: `pat-prof-${Date.now()}`,
      userId: req.user!.id,
    };
    db.patientProfiles.push(patient);
    saveDb();
    return res.json([]);
  }

  const patientAppointments = db.appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .map((apt) => {
      const doc = db.doctorProfiles.find((d) => d.id === apt.doctorId);
      const docUser = doc ? db.users.find((u) => u.id === doc.userId) : null;
      const specialty = doc ? db.specialties.find((s) => s.id === doc.specialtyId) : null;

      return {
        ...apt,
        doctor: doc
          ? {
              ...doc,
              user: docUser ? { fullName: docUser.fullName, email: docUser.email, phoneNumber: docUser.phoneNumber } : null,
              specialty,
            }
          : null,
        patient: {
          id: patient.id,
          userId: patient.userId,
          user: {
            fullName: req.user!.fullName,
            email: req.user!.email,
          },
        },
      };
    });

  return res.json(patientAppointments);
});

// Doctor gets their assigned appointments
apiRouter.get('/appointments/doctor', authMiddleware, roleGuard(['DOCTOR']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const doc = db.doctorProfiles.find((d) => d.userId === req.user?.id);

  if (!doc) {
    return res.json([]);
  }

  const docAppointments = db.appointments
    .filter((a) => a.doctorId === doc.id)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .map((apt) => {
      const patient = db.patientProfiles.find((p) => p.id === apt.patientId);
      const patientUser = patient ? db.users.find((u) => u.id === patient.userId) : null;

      return {
        ...apt,
        patient: patient
          ? {
              ...patient,
              user: patientUser
                ? { fullName: patientUser.fullName, email: patientUser.email, phoneNumber: patientUser.phoneNumber }
                : null,
            }
          : null,
      };
    });

  return res.json(docAppointments);
});

// Get single appointment details with authorization check
apiRouter.get('/appointments/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id);

  if (!apt) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  const doc = db.doctorProfiles.find((d) => d.id === apt.doctorId);
  const patient = db.patientProfiles.find((p) => p.id === apt.patientId);
  const docUser = doc ? db.users.find((u) => u.id === doc.userId) : null;
  const patientUser = patient ? db.users.find((u) => u.id === patient.userId) : null;
  const specialty = doc ? db.specialties.find((s) => s.id === doc.specialtyId) : null;

  // Authorization check: Patient owns it, Doctor owns it, or User is Admin
  const isOwnerPatient = patient && patient.userId === req.user?.id;
  const isOwnerDoctor = doc && doc.userId === req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';

  if (!isOwnerPatient && !isOwnerDoctor && !isAdmin) {
    return res.status(403).json({ message: 'You are not authorized to view this appointment' });
  }

  return res.json({
    ...apt,
    doctor: doc
      ? {
          ...doc,
          user: docUser ? { fullName: docUser.fullName, email: docUser.email, phoneNumber: docUser.phoneNumber } : null,
          specialty,
        }
      : null,
    patient: patient
      ? {
          ...patient,
          user: patientUser
            ? { fullName: patientUser.fullName, email: patientUser.email, phoneNumber: patientUser.phoneNumber }
            : null,
        }
      : null,
  });
});

// Update appointment status (Doctor or Admin)
apiRouter.patch('/appointments/:id/status', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id);

  if (!apt) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  // If DOCTOR, verify doctor owns this appointment
  if (req.user?.role === 'DOCTOR') {
    const doc = db.doctorProfiles.find((d) => d.userId === req.user?.id);
    if (!doc || doc.id !== apt.doctorId) {
      return res.status(403).json({ message: 'You can only update appointments assigned to your practice' });
    }
  }

  const { status, cancellationReason } = req.body;
  const allowedStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(', ')}` });
  }

  apt.status = status;
  if (cancellationReason) {
    apt.cancellationReason = cancellationReason;
  }
  apt.updatedAt = new Date().toISOString();

  saveDb();
  return res.json({ message: 'Appointment status updated successfully', appointment: apt });
});

// Cancel appointment (Patient, Doctor, or Admin)
apiRouter.patch('/appointments/:id/cancel', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const apt = db.appointments.find((a) => a.id === req.params.id);

  if (!apt) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  const doc = db.doctorProfiles.find((d) => d.id === apt.doctorId);
  const patient = db.patientProfiles.find((p) => p.id === apt.patientId);

  const isOwnerPatient = patient && patient.userId === req.user?.id;
  const isOwnerDoctor = doc && doc.userId === req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';

  if (!isOwnerPatient && !isOwnerDoctor && !isAdmin) {
    return res.status(403).json({ message: 'You are not authorized to cancel this appointment' });
  }

  if (apt.status === 'COMPLETED') {
    return res.status(400).json({ message: 'Completed appointments cannot be cancelled' });
  }

  const { reason = 'Cancelled by user' } = req.body;
  apt.status = 'CANCELLED';
  apt.cancellationReason = reason;
  apt.updatedAt = new Date().toISOString();

  saveDb();
  return res.json({ message: 'Appointment cancelled successfully', appointment: apt });
});

// ==========================================
// 5. ADMINISTRATION MODULE
// ==========================================

apiRouter.get('/admin/dashboard', authMiddleware, roleGuard(['ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const db = getDb();

  const totalPatients = db.users.filter((u) => u.role === 'PATIENT').length;
  const totalDoctors = db.doctorProfiles.length;
  const pendingApprovals = db.doctorProfiles.filter((d) => d.approvalStatus === 'PENDING').length;
  const approvedDoctors = db.doctorProfiles.filter((d) => d.approvalStatus === 'APPROVED').length;
  const totalAppointments = db.appointments.length;

  const statusCounts = {
    CONFIRMED: db.appointments.filter((a) => a.status === 'CONFIRMED').length,
    PENDING: db.appointments.filter((a) => a.status === 'PENDING').length,
    COMPLETED: db.appointments.filter((a) => a.status === 'COMPLETED').length,
    CANCELLED: db.appointments.filter((a) => a.status === 'CANCELLED').length,
    REJECTED: db.appointments.filter((a) => a.status === 'REJECTED').length,
  };

  const totalRevenue = db.appointments
    .filter((a) => a.status === 'COMPLETED' || a.status === 'CONFIRMED')
    .reduce((sum, apt) => {
      const doc = db.doctorProfiles.find((d) => d.id === apt.doctorId);
      return sum + (doc ? doc.consultationFee : 0);
    }, 0);

  const recentAppointments = db.appointments
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map((apt) => {
      const doc = db.doctorProfiles.find((d) => d.id === apt.doctorId);
      const docUser = doc ? db.users.find((u) => u.id === doc.userId) : null;
      const patient = db.patientProfiles.find((p) => p.id === apt.patientId);
      const patientUser = patient ? db.users.find((u) => u.id === patient.userId) : null;

      return {
        ...apt,
        doctorName: docUser ? docUser.fullName : 'Unknown Doctor',
        patientName: patientUser ? patientUser.fullName : 'Unknown Patient',
        fee: doc ? doc.consultationFee : 0,
      };
    });

  return res.json({
    metrics: {
      totalPatients,
      totalDoctors,
      pendingApprovals,
      approvedDoctors,
      totalAppointments,
      totalRevenue,
      statusCounts,
    },
    recentAppointments,
  });
});

apiRouter.get('/admin/doctors', authMiddleware, roleGuard(['ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const list = db.doctorProfiles.map((doc) => {
    const user = db.users.find((u) => u.id === doc.userId);
    const specialty = db.specialties.find((s) => s.id === doc.specialtyId);
    const appointmentCount = db.appointments.filter((a) => a.doctorId === doc.id).length;

    return {
      ...doc,
      user: user ? { id: user.id, fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber, isActive: user.isActive } : null,
      specialty,
      appointmentCount,
    };
  });
  return res.json(list);
});

apiRouter.patch('/admin/doctors/:id/approval', authMiddleware, roleGuard(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const doc = db.doctorProfiles.find((d) => d.id === req.params.id);

  if (!doc) {
    return res.status(404).json({ message: 'Doctor profile not found' });
  }

  const { approvalStatus } = req.body;
  if (!['APPROVED', 'PENDING', 'REJECTED'].includes(approvalStatus)) {
    return res.status(400).json({ message: 'Invalid approvalStatus. Must be APPROVED, PENDING, or REJECTED' });
  }

  doc.approvalStatus = approvalStatus;
  doc.updatedAt = new Date().toISOString();
  saveDb();

  return res.json({ message: `Doctor profile status updated to ${approvalStatus}`, doctor: doc });
});

apiRouter.patch('/admin/users/:id/toggle-active', authMiddleware, roleGuard(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role === 'ADMIN') {
    return res.status(400).json({ message: 'Cannot deactivate administrator account' });
  }

  user.isActive = !user.isActive;
  user.updatedAt = new Date().toISOString();
  saveDb();

  return res.json({ message: `User account ${user.isActive ? 'activated' : 'deactivated'}`, user });
});

apiRouter.get('/admin/patients', authMiddleware, roleGuard(['ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const list = db.patientProfiles.map((pat) => {
    const user = db.users.find((u) => u.id === pat.userId);
    const appointmentCount = db.appointments.filter((a) => a.patientId === pat.id).length;

    return {
      ...pat,
      user: user ? { id: user.id, fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber, isActive: user.isActive, createdAt: user.createdAt } : null,
      appointmentCount,
    };
  });
  return res.json(list);
});

apiRouter.get('/admin/appointments', authMiddleware, roleGuard(['ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const list = db.appointments
    .slice()
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .map((apt) => {
      const doc = db.doctorProfiles.find((d) => d.id === apt.doctorId);
      const docUser = doc ? db.users.find((u) => u.id === doc.userId) : null;
      const specialty = doc ? db.specialties.find((s) => s.id === doc.specialtyId) : null;
      const patient = db.patientProfiles.find((p) => p.id === apt.patientId);
      const patientUser = patient ? db.users.find((u) => u.id === patient.userId) : null;

      return {
        ...apt,
        doctor: doc ? { ...doc, user: docUser, specialty } : null,
        patient: patient ? { ...patient, user: patientUser } : null,
      };
    });

  return res.json(list);
});

// OpenAPI spec JSON endpoint for documentation and Swagger UI
apiRouter.get('/openapi.json', (_req: Request, res: Response) => {
  return res.json({
    openapi: '3.0.0',
    info: {
      title: 'Medrella Doctor Appointment Scheduler REST API',
      version: '1.0.0',
      description: 'Production-ready REST API for appointments, doctors, patients, and healthcare administration.',
    },
    servers: [{ url: '/api', description: 'Local Dev / Cloud Run API Server' }],
    paths: {
      '/auth/register': { post: { summary: 'Register a patient or doctor account' } },
      '/auth/login': { post: { summary: 'Sign in with email and password' } },
      '/auth/me': { get: { summary: 'Get current authenticated user and profile' } },
      '/doctors': { get: { summary: 'List approved doctors with search & specialty filters' } },
      '/doctors/{id}': { get: { summary: 'Get doctor details and schedule' } },
      '/doctors/{id}/availability': { get: { summary: 'Calculate real-time slots for a given date' } },
      '/appointments': { post: { summary: 'Book an appointment with atomic overlap check' } },
      '/appointments/my': { get: { summary: 'Get logged-in patient appointments' } },
      '/appointments/doctor': { get: { summary: 'Get logged-in doctor appointments' } },
      '/appointments/{id}/status': { patch: { summary: 'Update appointment status' } },
      '/appointments/{id}/cancel': { patch: { summary: 'Cancel an appointment' } },
      '/admin/dashboard': { get: { summary: 'Platform summary metrics and recent activity' } },
      '/admin/doctors/{id}/approval': { patch: { summary: 'Approve or reject doctor registration' } },
    },
  });
});

// Dev reset endpoint
apiRouter.post('/dev/reset-database', (_req: Request, res: Response) => {
  resetDatabase();
  return res.json({ message: 'Database reset to initial demo seeds successfully' });
});
