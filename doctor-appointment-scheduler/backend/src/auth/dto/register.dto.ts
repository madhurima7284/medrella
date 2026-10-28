import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Johnathan Doe' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['PATIENT', 'DOCTOR'], default: 'PATIENT' })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ example: '+1 (555) 123-4567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // Optional Doctor profile fields
  @ApiPropertyOptional({ example: 'spec-uuid' })
  @IsOptional()
  @IsString()
  specialtyId?: string;

  @ApiPropertyOptional({ example: 'MD, FACC' })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'Experienced cardiologist' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'Beacon Heart Clinic' })
  @IsOptional()
  @IsString()
  clinicName?: string;

  @ApiPropertyOptional({ example: '450 Lexington Ave, New York' })
  @IsOptional()
  @IsString()
  clinicAddress?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}
