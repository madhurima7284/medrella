import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Specialties')
@Controller('specialties')
export class SpecialtiesController {
  constructor(private specialtiesService: SpecialtiesService) {}

  @ApiOperation({ summary: 'List all medical specialties with doctor counts' })
  @Get()
  findAll() {
    return this.specialtiesService.findAll();
  }

  @ApiOperation({ summary: 'Create a medical specialty (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(
    @Body('name') name: string,
    @Body('description') description?: string,
    @Body('iconName') iconName?: string
  ) {
    return this.specialtiesService.create(name, description, iconName);
  }

  @ApiOperation({ summary: 'Update medical specialty (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('description') description?: string,
    @Body('iconName') iconName?: string
  ) {
    return this.specialtiesService.update(id, name, description, iconName);
  }

  @ApiOperation({ summary: 'Delete medical specialty (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.specialtiesService.delete(id);
  }
}
