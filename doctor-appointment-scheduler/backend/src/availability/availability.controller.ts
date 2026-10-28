import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Availability')
@Controller()
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @ApiOperation({ summary: 'Get doctor available slots for a given date' })
  @ApiQuery({ name: 'date', required: true, example: '2026-11-01' })
  @Get('doctors/:id/availability')
  getSlots(@Param('id') doctorId: string, @Query('date') date: string) {
    return this.availabilityService.getDoctorSlots(doctorId, date);
  }

  @ApiOperation({ summary: 'Update doctor working schedule (Doctor only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @Patch('doctors/me/availability')
  updateAvailability(@Req() req: any, @Body('schedules') schedules: any[]) {
    return this.availabilityService.updateDoctorAvailability(req.user.id, schedules);
  }
}
