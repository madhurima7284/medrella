import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DoctorsModule,
    SpecialtiesModule,
    AvailabilityModule,
    AppointmentsModule,
    AdminModule,
  ],
})
export class AppModule {}
