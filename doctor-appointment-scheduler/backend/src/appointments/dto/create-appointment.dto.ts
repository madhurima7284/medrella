import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsISO8601, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID of the doctor profile' })
  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @ApiProperty({ description: 'ISO 8601 UTC timestamp for appointment start', example: '2026-11-01T10:00:00.000Z' })
  @IsNotEmpty()
  @IsISO8601()
  startAt: string;

  @ApiPropertyOptional({ example: 'Annual cardiovascular checkup' })
  @IsOptional()
  @IsString()
  reasonForVisit?: string;
}
