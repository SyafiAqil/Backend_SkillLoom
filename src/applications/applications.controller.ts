import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  // 1. [CREATE] Melamar Proyek (Siswa)
  @Post()
  async create(
    @GetUser('id') userId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(dto, userId);
  }

  // 2. [READ ALL] Lihat Semua Lamaran Milik Siswa
  @Get('my-applications')
  async findMyApplications(@GetUser('id') userId: string) {
    return this.applicationsService.findMyApplications(userId);
  }

  // 3. [READ BY PROJECT] Lihat Semua Pelamar di Proyek Tertentu (UMKM)
  @Get('project/:projectId')
  async findApplicantsByProject(
    @Param('projectId') projectId: string,
    @GetUser('id') userId: string,
  ) {
    return this.applicationsService.findApplicantsByProject(projectId, userId);
  }

  // 4. [READ ONE] Lihat Detail 1 Lamaran
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.applicationsService.findOne(id, userId);
  }

  // 5. [UPDATE PITCH] Edit Pesan Lamaran (Siswa)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
    @GetUser('id') userId: string,
  ) {
    return this.applicationsService.update(id, dto, userId);
  }

  // 6. [UPDATE STATUS] Menerima / Menolak Pelamar (UMKM)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') applicationId: string,
    @Body() dto: UpdateStatusDto,
    @GetUser('id') userId: string,
  ) {
    return this.applicationsService.updateStatus(
      applicationId,
      dto.status,
      userId,
    );
  }

  // 7. [DELETE] Batalkan / Hapus Lamaran (Siswa)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.applicationsService.remove(id, userId);
  }
}