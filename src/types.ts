export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
  iconName: string;
  doctorCount?: number;
}

export interface Doctor {
  id: string;
  userId: string;
  specialtyId: string;
  city: 'Tirupati' | 'Chennai';
  state: 'Andhra Pradesh' | 'Tamil Nadu';
  qualifications: string;
  experienceYears: number;
  consultationFee: number;
  bio: string;
  clinicName: string;
  clinicAddress: string;
  profileImageUrl?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  user?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
  };
  specialty?: Specialty;
  availabilities?: AvailabilitySchedule[];
}

export interface AvailabilitySchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface Slot {
  time: string;
  startAt: string;
  endAt: string;
  available: boolean;
  isBooked: boolean;
  isPast: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startAt: string;
  endAt: string;
  reasonForVisit?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'COMPLETED';
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  doctor?: Doctor;
  patient?: {
    id: string;
    userId: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    emergencyContact?: string;
    user?: {
      fullName: string;
      email: string;
      phoneNumber?: string;
    };
  };
}

export interface DashboardMetrics {
  totalPatients: number;
  totalDoctors: number;
  pendingApprovals: number;
  approvedDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  statusCounts: {
    CONFIRMED: number;
    PENDING: number;
    COMPLETED: number;
    CANCELLED: number;
    REJECTED: number;
  };
}
