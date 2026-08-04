import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShowcaseDto } from './dto/create-showcase.dto';
import { UpdateShowcaseDto } from './dto/update-showcase.dto';
import { ApplicationStatus, Role } from '@prisma/client';

@Injectable()
export class ShowcasesService {
  constructor(private prisma: PrismaService) {}

  // 1. TAMBAH SHOWCASE KARYA (Siswa atau UMKM)
  async create(dto: CreateShowcaseDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { siswaProfile: true, umkmProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: {
        applications: {
          where: { status: ApplicationStatus.ACCEPTED },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Proyek tidak ditemukan!');
    }

    if (project.applications.length === 0) {
      throw new BadRequestException('Proyek ini belum memiliki pelamar yang diterima.');
    }

    const acceptedSiswaId = project.applications[0].siswaId;

    // Verifikasi bahwa user adalah Siswa pengerja atau UMKM pemilik proyek
    const isOwnerSiswa = user.siswaProfile && user.siswaProfile.id === acceptedSiswaId;
    const isOwnerUmkm = user.umkmProfile && user.umkmProfile.id === project.umkmId;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwnerSiswa && !isOwnerUmkm && !isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mempublikasikan showcase proyek ini!');
    }

    const existingShowcase = await this.prisma.showcase.findUnique({
      where: { projectId: dto.projectId },
    });

    if (existingShowcase) {
      throw new ConflictException('Showcase untuk proyek ini sudah terpublikasi!');
    }

    return this.prisma.showcase.create({
      data: {
        projectId: dto.projectId,
        siswaId: acceptedSiswaId,
        title: dto.title,
        imageUrl: dto.imageUrl,
        testimonial: dto.testimonial,
        rating: dto.rating,
        isFeatured: dto.isFeatured ?? false,
      },
      include: {
        project: true,
        siswa: true,
      },
    });
  }

  // 2. LIHAT SEMUA SHOWCASE (Publik, bisa filter isFeatured)
  async findAll(isFeatured?: boolean) {
    const whereCondition: any = {};
    if (typeof isFeatured === 'boolean') {
      whereCondition.isFeatured = isFeatured;
    }

    return this.prisma.showcase.findMany({
      where: whereCondition,
      include: {
        project: {
          include: {
            umkm: true,
          },
        },
        siswa: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. DETAIL 1 SHOWCASE
  async findOne(id: string) {
    const showcase = await this.prisma.showcase.findUnique({
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

    if (!showcase) {
      throw new NotFoundException('Showcase tidak ditemukan!');
    }

    return showcase;
  }

  // 4. UPDATE SHOWCASE
  async update(id: string, dto: UpdateShowcaseDto, userId: string) {
    const showcase = await this.prisma.showcase.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!showcase) {
      throw new NotFoundException('Showcase tidak ditemukan!');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { siswaProfile: true, umkmProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    const isOwnerSiswa = user.siswaProfile && user.siswaProfile.id === showcase.siswaId;
    const isOwnerUmkm = user.umkmProfile && user.umkmProfile.id === showcase.project.umkmId;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwnerSiswa && !isOwnerUmkm && !isAdmin) {
      throw new ForbiddenException('Anda tidak berhak mengubah showcase ini.');
    }

    return this.prisma.showcase.update({
      where: { id },
      data: dto,
      include: {
        project: true,
        siswa: true,
      },
    });
  }

  // 5. HAPUS SHOWCASE
  async remove(id: string, userId: string) {
    const showcase = await this.prisma.showcase.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!showcase) {
      throw new NotFoundException('Showcase tidak ditemukan!');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { siswaProfile: true, umkmProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    const isOwnerSiswa = user.siswaProfile && user.siswaProfile.id === showcase.siswaId;
    const isOwnerUmkm = user.umkmProfile && user.umkmProfile.id === showcase.project.umkmId;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwnerSiswa && !isOwnerUmkm && !isAdmin) {
      throw new ForbiddenException('Anda tidak berhak menghapus showcase ini.');
    }

    await this.prisma.showcase.delete({ where: { id } });

    return { message: 'Showcase berhasil dihapus.' };
  }
}
