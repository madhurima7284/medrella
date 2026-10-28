import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { Role, ApprovalStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === Role.ADMIN) {
      throw new BadRequestException('Public registration as Administrator is forbidden');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        role: dto.role,
        phoneNumber: dto.phoneNumber?.trim() || null,
        isActive: true,
      },
    });

    let profile: any = null;

    if (dto.role === Role.PATIENT) {
      profile = await this.prisma.patientProfile.create({
        data: {
          userId: user.id,
        },
      });
    } else if (dto.role === Role.DOCTOR) {
      let specialtyId = dto.specialtyId;
      if (!specialtyId) {
        const firstSpec = await this.prisma.specialty.findFirst();
        specialtyId = firstSpec?.id || '';
      }

      profile = await this.prisma.doctorProfile.create({
        data: {
          userId: user.id,
          specialtyId,
          qualifications: dto.qualifications || 'Medical Doctor (MD)',
          experienceYears: dto.experienceYears || 2,
          consultationFee: dto.consultationFee || 100,
          bio: dto.bio || 'Compassionate healthcare professional dedicated to patient care.',
          clinicName: dto.clinicName || 'City Health Medical Center',
          clinicAddress: dto.clinicAddress || '100 Medical Plaza, Suite 300',
          profileImageUrl: dto.profileImageUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
          approvalStatus: ApprovalStatus.PENDING,
        },
      });

      // Default Mon-Fri availability schedule
      for (let day = 1; day <= 5; day++) {
        await this.prisma.availability.create({
          data: {
            doctorId: profile.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            slotDurationMinutes: 30,
            isActive: true,
          },
        });
      }
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const { passwordHash: _, ...safeUser } = user;
    return {
      message: 'Account registered successfully',
      token,
      user: safeUser,
      profile,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        patient: true,
        doctor: {
          include: { specialty: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Please contact support.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const { passwordHash: _, ...safeUser } = user;
    const profile = user.role === Role.PATIENT ? user.patient : user.doctor;

    return {
      message: 'Login successful',
      token,
      user: safeUser,
      profile,
    };
  }
}
