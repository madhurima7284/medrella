import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, specialtyId?: string, status: string = 'APPROVED', city?: string) {
    const where: any = {};

    if (status !== 'ALL') {
      where.approvalStatus = status as ApprovalStatus;
    }

    if (city && city !== 'ALL') {
      where.city = { equals: city, mode: 'insensitive' };
    }

    if (specialtyId && specialtyId !== 'ALL') {
      where.specialtyId = specialtyId;
    }

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { clinicName: { contains: search, mode: 'insensitive' } },
        { qualifications: { contains: search, mode: 'insensitive' } },
        { specialty: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.doctorProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phoneNumber: true, isActive: true },
        },
        specialty: true,
      },
      orderBy: { experienceYears: 'desc' },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phoneNumber: true },
        },
        specialty: true,
        availabilities: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return doctor;
  }

  async updateProfile(userId: string, data: any) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.prisma.doctorProfile.update({
      where: { id: doctor.id },
      data,
      include: { specialty: true },
    });
  }
}
