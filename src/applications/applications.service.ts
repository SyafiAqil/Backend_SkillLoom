import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) { }

  // ==========================================
  // 1. CREATE (SISWA: Melamar Proyek)
  // ==========================================
  async create(dto: CreateApplicationDto, userId: string) {
    const siswaProfile = await this.prisma.siswaProfile.findUnique({
      where: { userId },
    });

    if (!siswaProfile) {
      throw new BadRequestException(
        'Profil Siswa tidak ditemukan. Selesaikan pendaftaran profil Anda.',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Proyek tidak ditemukan!');
    }

    if (!project.adminApproved) {
      throw new BadRequestException(
        'Proyek ini belum disetujui oleh Admin/Guru Pembimbing.',
      );
    }

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

  // ==========================================
  // 2. READ (Ambil Semua Lamaran Milik Siswa)
  // ==========================================
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

  // ==========================================
  // 3. READ (Ambil Detail 1 Lamaran Berdasarkan ID)
  // ==========================================
  async findOne(id: string, userId: string) {
    const application = await this.prisma.projectApplication.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            umkm: true,
          },
        },
        siswa: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Lamaran tidak ditemukan!');
    }

    // Pengecekan Hak Akses: Hanya Siswa pembuat atau UMKM pemilik proyek yang bisa akses detail ini
    const siswaProfile = await this.prisma.siswaProfile.findUnique({ where: { userId } });
    const umkmProfile = await this.prisma.umkmProfile.findUnique({ where: { userId } });

    const isApplicant = siswaProfile && application.siswaId === siswaProfile.id;
    const isOwner = umkmProfile && application.project.umkmId === umkmProfile.id;

    if (!isApplicant && !isOwner) {
      throw new ForbiddenException('Anda tidak berhak melihat lamaran ini.');
    }

    return application;
  }

  // ==========================================
  // 4. READ (UMKM: Melihat Pelamar pada Suatu Proyek)
  // ==========================================
  async findApplicantsByProject(projectId: string, userId: string) {
    const umkmProfile = await this.prisma.umkmProfile.findUnique({
      where: { userId },
    });

    if (!umkmProfile) {
      throw new ForbiddenException('Profil UMKM tidak ditemukan.');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Proyek tidak ditemukan!');
    }

    if (project.umkmId !== umkmProfile.id) {
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

  // ==========================================
  // 5. UPDATE (SISWA: Edit Pitch Message Lamaran)
  // ==========================================
  async update(id: string, dto: UpdateApplicationDto, userId: string) {
    const siswaProfile = await this.prisma.siswaProfile.findUnique({
      where: { userId },
    });

    const application = await this.prisma.projectApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Lamaran tidak ditemukan!');
    }

    if (application.siswaId !== siswaProfile?.id) {
      throw new ForbiddenException('Anda tidak berhak mengedit lamaran ini!');
    }

    // Jika lamaran sudah diproses (Diterima / Ditolak), Siswa tidak boleh mengedit lagi
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(
        'Lamaran yang sudah diproses tidak dapat diubah lagi!',
      );
    }

    return this.prisma.projectApplication.update({
      where: { id },
      data: { pitchMessage: dto.pitchMessage },
      include: {
        project: true,
      },
    });
  }

  // ==========================================
  // 6. UPDATE STATUS (UMKM: Terima / Tolak Pelamar)
  // ==========================================
  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
    userId: string,
  ) {
    const umkmProfile = await this.prisma.umkmProfile.findUnique({
      where: { userId },
    });

    const application = await this.prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: {
        project: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Lamaran tidak ditemukan!');
    }

    if (application.project.umkmId !== umkmProfile?.id) {
      throw new BadRequestException(
        'Anda tidak berhak mengubah status lamaran ini!',
      );
    }

    // Jika lamaran Diterima, ubah status Proyek Utama menjadi IN_PROGRESS
    if (status === ApplicationStatus.ACCEPTED) {
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

  // ==========================================
  // 7. DELETE (SISWA: Batalkan / Hapus Lamaran)
  // ==========================================
  async remove(id: string, userId: string) {
    const siswaProfile = await this.prisma.siswaProfile.findUnique({
      where: { userId },
    });

    const application = await this.prisma.projectApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Lamaran tidak ditemukan!');
    }

    if (application.siswaId !== siswaProfile?.id) {
      throw new ForbiddenException('Anda tidak berhak menghapus lamaran ini!');
    }

    await this.prisma.projectApplication.delete({
      where: { id },
    });

    return { message: 'Lamaran berhasil dibatalkan dan dihapus.' };
  }
}