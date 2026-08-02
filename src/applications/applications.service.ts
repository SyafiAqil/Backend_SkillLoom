import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) { }

  // 1. Siswa Melamar Proyek
  async create(dto: CreateApplicationDto, userId: string) {
    // Cari profil Siswa berdasarkan userId
    const siswaProfile = await this.prisma.siswaProfile.findUnique({
      where: { userId },
    });

    if (!siswaProfile) {
      throw new BadRequestException(
        'Profil Siswa tidak ditemukan. Selesaikan pendaftaran profil Anda.',
      );
    }

    // Cek apakah proyek ada
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Proyek tidak ditemukan!');
    }

    // Cek apakah siswa sudah pernah melamar di proyek ini
    const existingApplication = await this.prisma.projectApplication.findUnique(
      {
        where: {
          projectId_siswaId: {
            projectId: dto.projectId,
            siswaId: siswaProfile.id,
          },
        },
      },
    );

    if (existingApplication) {
      throw new ConflictException('Anda sudah melamar pada proyek ini!');
    }

    return this.prisma.projectApplication.create({
      data: {
        projectId: dto.projectId,
        siswaId: siswaProfile.id,
        pitchMessage: dto.pitchMessage,
      },
      include: {
        project: true,
        siswa: true,
      },
    });
  }

  // 2. Lihat Semua Lamaran Milik Siswa
  async findMyApplications(userId: string) {
    const siswaProfile = await this.prisma.siswaProfile.findUnique({
      where: { userId },
    });

    if (!siswaProfile) {
      throw new BadRequestException('Profil Siswa tidak ditemukan.');
    }

    return this.prisma.projectApplication.findMany({
      where: { siswaId: siswaProfile.id },
      include: {
        project: {
          include: {
            umkm: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  // 3. UMKM Melihat Daftar Pelamar di Proyek Miliknya
  async findApplicantsByProject(projectId: string, userId: string) {
    // Pastikan proyek tersebut ada dan benar milik UMKM yang sedang login
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { umkm: true },
    });

    if (!project) {
      throw new NotFoundException('Proyek tidak ditemukan!');
    }

    if (project.umkm.userId !== userId) {
      throw new BadRequestException('Anda tidak memiliki akses ke proyek ini!');
    }

    return this.prisma.projectApplication.findMany({
      where: { projectId },
      include: {
        siswa: {
          select: {
            id: true,
            fullName: true,
            nisn: true,
            jurusan: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. UMKM Menerima atau Menolak Pelamar
  async updateStatus(
    applicationId: string,
    status: 'ACCEPTED' | 'REJECTED',
    userId: string,
  ) {
    const application = await this.prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: {
        project: {
          include: { umkm: true },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Lamaran tidak ditemukan!');
    }

    if (application.project.umkm.userId !== userId) {
      throw new BadRequestException('Anda tidak berhak mengubah status lamaran ini!');
    }

    // Jika diterima, ubah status proyek menjadi IN_PROGRESS
    if (status === 'ACCEPTED') {
      await this.prisma.project.update({
        where: { id: application.projectId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return this.prisma.projectApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        siswa: true,
        project: true,
      },
    });

  }

}
