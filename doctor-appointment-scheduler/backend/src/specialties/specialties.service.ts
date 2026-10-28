import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class SpecialtiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.specialty.findMany({
      include: {
        _count: {
          select: {
            doctors: {
              where: { approvalStatus: ApprovalStatus.APPROVED },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return list.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      iconName: s.iconName,
      doctorCount: s._count.doctors,
    }));
  }

  async create(name: string, description?: string, iconName?: string) {
    const existing = await this.prisma.specialty.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      throw new ConflictException('Specialty already exists');
    }

    return this.prisma.specialty.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        iconName: iconName || 'Stethoscope',
      },
    });
  }

  async update(id: string, name?: string, description?: string, iconName?: string) {
    const spec = await this.prisma.specialty.findUnique({ where: { id } });
    if (!spec) throw new NotFoundException('Specialty not found');

    return this.prisma.specialty.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(iconName ? { iconName } : {}),
      },
    });
  }

  async delete(id: string) {
    const docCount = await this.prisma.doctorProfile.count({ where: { specialtyId: id } });
    if (docCount > 0) {
      throw new ConflictException('Cannot delete specialty with assigned doctors');
    }

    return this.prisma.specialty.delete({ where: { id } });
  }
}
