import { Controller, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @ApiOperation({ summary: 'Browse and search doctor directory' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'specialtyId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['APPROVED', 'PENDING', 'ALL'] })
  @ApiQuery({ name: 'city', required: false, enum: ['Tirupati', 'Chennai', 'ALL'] })
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('status') status?: string,
    @Query('city') city?: string,
  ) {
    return this.doctorsService.findAll(search, specialtyId, status, city);
  }

  @ApiOperation({ summary: 'Get doctor profile details' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update doctor profile (Doctor only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @Patch('me/profile')
  updateMyProfile(@Req() req: any, @Body() body: any) {
    return this.doctorsService.updateProfile(req.user.id, body);
  }
}
