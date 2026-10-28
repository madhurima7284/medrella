import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus, ApprovalStatus, Role } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, dto: CreateAppointmentDto) {
    let patient = await this.prisma.patientProfile.findUnique({
      where: { userId: user.id },
    });

    if (!patient) {
      patient = await this.prisma.patientProfile.create({
        data: { userId: user.id },
      });
    }

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
      include: { user: true, availabilities: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    if (doctor.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new BadRequestException('Doctor is not approved to accept appointments');
    }

    if (!doctor.user.isActive) {
      throw new BadRequestException('Doctor account is currently inactive');
    }

    const startTime = new Date(dto.startAt);
    const now = new Date();

    if (startTime.getTime() <= now.getTime()) {
      throw new BadRequestException('Appointments cannot be booked in the past');
    }

    // Check doctor availability schedule for day of week
    const dayOfWeek = startTime.getUTCDay();
    const schedule = doctor.availabilities.find(
      (a) => a.dayOfWeek === dayOfWeek && a.isActive
    );

    if (!schedule) {
      throw new BadRequestException('Doctor does not hold office hours on this day');
    }

    const slotDuration = schedule.slotDurationMinutes || 30;
    const endTime = new Date(startTime.getTime() + slotDuration * 60000);

    // Concurrency-safe atomic check within Prisma transaction
    return await this.prisma.$transaction(async (tx) => {
      // 1. Check doctor conflict
      const doctorConflict = await tx.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
          AND: [
            { startAt: { lt: endTime } },
            { endAt: { gt: startTime } },
          ],
        },
      });

      if (doctorConflict) {
        throw new ConflictException(
          'This appointment slot was already reserved. Please select another available time.'
        );
      }

      // 2. Check patient overlap
      const patientConflict = await tx.appointment.findFirst({
        where: {
          patientId: patient!.id,
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
          AND: [
            { startAt: { lt: endTime } },
            { endAt: { gt: startTime } },
          ],
        },
      });

      if (patientConflict) {
        throw new ConflictException(
          'You already have another appointment booked during this time interval.'
        );
      }

      return tx.appointment.create({
        data: {
          patientId: patient!.id,
          doctorId: doctor.id,
          startAt: startTime,
          endAt: endTime,
          reasonForVisit: dto.reasonForVisit || 'General Consultation',
          status: AppointmentStatus.CONFIRMED,
        },
        include: {
          doctor: {
            include: { user: true, specialty: true },
          },
          patient: {
            include: { user: true },
          },
        },
      });
    });
  }

  async findPatientAppointments(userId: string) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!patient) return [];

    return this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: {
          include: { user: true, specialty: true },
        },
      },
      orderBy: { startAt: 'desc' },
    });
  }

  async findDoctorAppointments(userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!doctor) return [];

    return this.prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: {
          include: { user: true },
        },
      },
      orderBy: { startAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true, specialty: true } },
        patient: { include: { user: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isPatient = appointment.patient.userId === user.id;
    const isDoctor = appointment.doctor.userId === user.id;
    const isAdmin = user.role === Role.ADMIN;

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException('You are not authorized to view this appointment');
    }

    return appointment;
  }

  async updateStatus(id: string, user: any, status: AppointmentStatus) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (user.role === Role.DOCTOR && appointment.doctor.userId !== user.id) {
      throw new ForbiddenException('Doctors can only manage their own appointments');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: { doctor: true, patient: true },
    });
  }

  async cancel(id: string, user: any, cancellationReason?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isPatient = appointment.patient.userId === user.id;
    const isDoctor = appointment.doctor.userId === user.id;
    const isAdmin = user.role === Role.ADMIN;

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException('You are not authorized to cancel this appointment');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Completed appointments cannot be cancelled');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: cancellationReason || 'Cancelled by user',
      },
    });
  }
}
