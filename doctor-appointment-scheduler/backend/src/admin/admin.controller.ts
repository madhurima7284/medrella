import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, ApprovalStatus } from '@prisma/client';

@ApiTags('Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @ApiOperation({ summary: 'Platform summary metrics and dashboard data' })
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @ApiOperation({ summary: 'List all registered doctors with approval status' })
  @Get('doctors')
  getAllDoctors() {
    return this.adminService.getAllDoctors();
  }

  @ApiOperation({ summary: 'Approve or reject doctor profile' })
  @Patch('doctors/:id/approval')
  updateApproval(
    @Param('id') id: string,
    @Body('approvalStatus') approvalStatus: ApprovalStatus
  ) {
    return this.adminService.updateDoctorApproval(id, approvalStatus);
  }

  @ApiOperation({ summary: 'List all registered patients' })
  @Get('patients')
  getAllPatients() {
    return this.adminService.getAllPatients();
  }

  @ApiOperation({ summary: 'Activate or deactivate user account' })
  @Patch('users/:id/toggle-active')
  toggleUserActive(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @ApiOperation({ summary: 'View all appointments across platform' })
  @Get('appointments')
  getAllAppointments() {
    return this.adminService.getAllAppointments();
  }
}
