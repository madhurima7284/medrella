import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
  role: z.enum(['PATIENT', 'DOCTOR']),
  // Doctor fields
  qualifications: z.string().optional(),
  specialtyId: z.string().optional(),
  consultationFee: z.coerce.number().min(0).optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
});

export const bookingSchema = z.object({
  doctorId: z.string().min(1, 'Doctor is required'),
  startAt: z.string().min(1, 'Appointment time slot is required'),
  reasonForVisit: z.string().min(3, 'Please describe the reason for your visit (min 3 chars)'),
});
