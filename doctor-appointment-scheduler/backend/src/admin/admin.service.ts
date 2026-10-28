import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ApprovalStatus, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const totalPatients = await this.prisma.user.count({ where: { role: Role.PATIENT } });
    const totalDoctors = await this.prisma.doctorProfile.count();
    const pendingApprovals = await this.prisma.doctorProfile.count({
      where: { approvalStatus: ApprovalStatus.PENDING },
    });
    const approvedDoctors = await this.prisma.doctorProfile.count({
      where: { approvalStatus: ApprovalStatus.APPROVED },
    });
    const totalAppointments = await this.prisma.appointment.count();

    const [confirmed, pending, completed, cancelled, rejected] = await Promise.all([
      this.prisma.appointment.count({ where: { status: AppointmentStatus.CONFIRMED } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.CANCELLED } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.REJECTED } }),
    ]);

    const recentAppointments = await this.prisma.appointment.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    return {
      metrics: {
        totalPatients,
        totalDoctors,
        pendingApprovals,
        approvedDoctors,
        totalAppointments,
        statusCounts: {
          CONFIRMED: confirmed,
          PENDING: pending,
          COMPLETED: completed,
          CANCELLED: cancelled,
          REJECTED: rejected,
        },
      },
      recentAppointments: recentAppointments.map((a) => ({
        id: a.id,
        startAt: a.startAt,
        status: a.status,
        reasonForVisit: a.reasonForVisit,
        doctorName: a.doctor.user.fullName,
        patientName: a.patient.user.fullName,
        fee: a.doctor.consultationFee,
      })),
    };
  }

  async getAllDoctors() {
    return this.prisma.doctorProfile.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneNumber: true, isActive: true } },
        specialty: true,
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDoctorApproval(id: string, status: ApprovalStatus) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    return this.prisma.doctorProfile.update({
      where: { id },
      data: { approvalStatus: status },
      include: { user: true },
    });
  }

  async getAllPatients() {
    return this.prisma.patientProfile.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneNumber: true, isActive: true, createdAt: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { user: { createdAt: 'desc' } },
    });
  }

  async toggleUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Cannot deactivate an administrator account');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  async getAllAppointments() {
    return this.prisma.appointment.findMany({
      include: {
        doctor: { include: { user: true, specialty: true } },
        patient: { include: { user: true } },
      },
      orderBy: { startAt: 'desc' },
    });
  }
}
