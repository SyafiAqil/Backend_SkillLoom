import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // 🔒 POST /applications -> Khusus SISWA melamar proyek
  @Roles(Role.SISWA)
  @Post()
  create(
    @Body() dto: CreateApplicationDto,
    @GetUser('sub') userId: string,
  ) {
    return this.applicationsService.create(dto, userId);
  }

  // 🔒 GET /applications/my -> Siswa melihat daftar lamaran miliknya
  @Roles(Role.SISWA)
  @Get('my')
  findMyApplications(@GetUser('sub') userId: string) {
    return this.applicationsService.findMyApplications(userId);
  }

  // 🔒 GET /applications/project/:projectId -> Khusus UMKM melihat pelamar di proyeknya
  @Roles(Role.UMKM)
  @Get('project/:projectId')
  findApplicantsByProject(
    @Param('projectId') projectId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.applicationsService.findApplicantsByProject(projectId, userId);
  }

  // 🔒 PATCH /applications/:id/status -> Khusus UMKM terima/tolak pelamar
  @Roles(Role.UMKM)
  @Patch(':id/status')
  updateStatus(
    @Param('id') applicationId: string,
    @Body('status') status: 'ACCEPTED' | 'REJECTED',
    @GetUser('sub') userId: string,
  ) {
    return this.applicationsService.updateStatus(applicationId, status, userId);
  }
}