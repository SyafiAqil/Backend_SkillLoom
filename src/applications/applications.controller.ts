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
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  // 1. [CREATE] Melamar Proyek (Siswa)
  @Post()
  async create(
    @GetUser('sub') userId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(dto, userId);
  }

  // 2. [READ ALL] Lihat Semua Lamaran Milik Siswa
  @Get('my-applications')
  async findMyApplications(@GetUser('sub') userId: string) {
    return this.applicationsService.findMyApplications(userId);
  }

  // 3. [READ BY PROJECT] Lihat Semua Pelamar di Proyek Tertentu (UMKM)
  @Get('project/:projectId')
  async findApplicantsByProject(
    @Param('projectId') projectId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.applicationsService.findApplicantsByProject(projectId, userId);
  }

  // 4. [READ ONE] Lihat Detail 1 Lamaran
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ) {
    return this.applicationsService.findOne(id, userId);
  }

  // 5. [UPDATE PITCH] Edit Pesan Lamaran (Siswa)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
    @GetUser('sub') userId: string,
  ) {
    return this.applicationsService.update(id, dto, userId);
  }

  // 6. [UPDATE STATUS] Menerima / Menolak Pelamar (UMKM)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') applicationId: string,
    @Body() dto: UpdateStatusDto,
    @GetUser('sub') userId: string,
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
    @GetUser('sub') userId: string,
  ) {
    return this.applicationsService.remove(id, userId);
  }

  // 8. [SUBMIT WORK] Siswa mengirim tautan hasil karya
  @Post(':id/submit')
  async submitWork(
    @Param('id') id: string,
    @Body() dto: SubmitApplicationDto,
    @GetUser('sub') userId: string,
  ) {
    return this.applicationsService.submitWork(id, dto, userId);
  }

  // 9. [REVIEW / REVISION] UMKM / Admin memberikan catatan revisi atau menyetujui karya
  @Patch(':id/revision')
  async reviewWork(
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
    @GetUser('sub') userId: string,
  ) {
    return this.applicationsService.reviewWork(id, dto, userId);
  }
}