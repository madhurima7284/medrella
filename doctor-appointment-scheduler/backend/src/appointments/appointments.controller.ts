import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, AppointmentStatus } from '@prisma/client';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @ApiOperation({ summary: 'Book an appointment (Patient only)' })
  @Roles(Role.PATIENT)
  @Post()
  create(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user, dto);
  }

  @ApiOperation({ summary: 'Get logged-in patient appointments' })
  @Roles(Role.PATIENT)
  @Get('my')
  findMy(@Req() req: any) {
    return this.appointmentsService.findPatientAppointments(req.user.id);
  }

  @ApiOperation({ summary: 'Get logged-in doctor appointments' })
  @Roles(Role.DOCTOR)
  @Get('doctor')
  findDoctorAppointments(@Req() req: any) {
    return this.appointmentsService.findDoctorAppointments(req.user.id);
  }

  @ApiOperation({ summary: 'Get single appointment details' })
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.appointmentsService.findOne(id, req.user);
  }

  @ApiOperation({ summary: 'Update appointment status (Doctor or Admin)' })
  @Roles(Role.DOCTOR, Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
    @Req() req: any
  ) {
    return this.appointmentsService.updateStatus(id, req.user, status);
  }

  @ApiOperation({ summary: 'Cancel appointment' })
  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('cancellationReason') cancellationReason: string,
    @Req() req: any
  ) {
    return this.appointmentsService.cancel(id, req.user, cancellationReason);
  }
}
