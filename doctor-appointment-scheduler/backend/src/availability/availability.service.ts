import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, ApprovalStatus } from '@prisma/client';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getDoctorSlots(doctorId: string, dateStr: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Date must be in format YYYY-MM-DD');
    }

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { availabilities: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    if (doctor.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new BadRequestException('Doctor is not approved to take appointments');
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();

    const schedule = doctor.availabilities.find(
      (a) => a.dayOfWeek === dayOfWeek && a.isActive
    );

    if (!schedule) {
      return {
        doctorId,
        date: dateStr,
        dayOfWeek,
        isAvailableDay: false,
        message: 'Doctor has no scheduled hours on this day',
        slots: [],
      };
    }

    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const slotDuration = schedule.slotDurationMinutes || 30;

    // Fetch existing active appointments for this doctor on that day
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED] },
        startAt: { gte: dayStart, lte: dayEnd },
      },
    });

    const slots = [];
    const current = new Date(year, month - 1, day, startH, startM, 0);
    const end = new Date(year, month - 1, day, endH, endM, 0);
    const now = new Date();

    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);

      if (slotEnd > end) break;

      const isBooked = appointments.some((apt) => {
        const aptStart = apt.startAt.getTime();
        const aptEnd = apt.endAt.getTime();
        return Math.max(slotStart.getTime(), aptStart) < Math.min(slotEnd.getTime(), aptEnd);
      });

      const isPast = slotStart.getTime() < now.getTime();

      slots.push({
        time: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        startAt: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        available: !isBooked && !isPast,
        isBooked,
        isPast,
      });

      current.setMinutes(current.getMinutes() + slotDuration);
    }

    return {
      doctorId,
      date: dateStr,
      dayOfWeek,
      isAvailableDay: true,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDurationMinutes: slotDuration,
      slots,
    };
  }

  async updateDoctorAvailability(userId: string, schedules: any[]) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: { doctorId: doctor.id },
      });

      const created = [];
      for (const s of schedules) {
        const item = await tx.availability.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: Number(s.dayOfWeek),
            startTime: s.startTime || '09:00',
            endTime: s.endTime || '17:00',
            slotDurationMinutes: Number(s.slotDurationMinutes) || 30,
            isActive: s.isActive ?? true,
          },
        });
        created.push(item);
      }
      return created;
    });
  }
}
