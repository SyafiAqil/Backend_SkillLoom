import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // 1. Buat Proyek Baru (Khusus UMKM - Butuh Admin Approval)
  async create(createProjectDto: CreateProjectDto, userId: string) {
    const umkmProfile = await this.prisma.umkmProfile.findUnique({
      where: { userId },
    });

    if (!umkmProfile) {
      throw new BadRequestException('Profil UMKM tidak ditemukan.');
    }

    return this.prisma.project.create({
      data: {
        title: createProjectDto.title,
        description: createProjectDto.description,
        category: createProjectDto.category,
        budget: createProjectDto.budget,
        deadline: new Date(createProjectDto.deadline),
        adminApproved: false, // Menunggu persetujuan Admin/Guru
        umkmId: umkmProfile.id,
      },
      include: { umkm: true },
    });
  }

  // 2. Ambil Semua Proyek yang Sudah Disetujui (Publik / Filter)
  async findAll(category?: string, search?: string) {
    return this.prisma.project.findMany({
      where: {
        status: 'OPEN',
        adminApproved: true, // Hanya proyek yang disetujui Admin yang tampil di katalog publik
        ...(category && { category }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        umkm: {
          select: {
            companyName: true,
            industryType: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Ambil Proyek Menunggu Persetujuan Admin (Khusus Admin)
  async findPendingApproval() {
    return this.prisma.project.findMany({
      where: { adminApproved: false },
      include: {
        umkm: {
          select: {
            companyName: true,
            industryType: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. Setujui Proyek (Khusus Admin)
  async approveProject(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Proyek tidak ditemukan');

    return this.prisma.project.update({
      where: { id },
      data: { adminApproved: true },
    });
  }

  // 5. Ambil Proyek Milik UMKM yang Sedang Login
  async findMyProjects(userId: string) {
    const umkmProfile = await this.prisma.umkmProfile.findUnique({
      where: { userId },
    });

    if (!umkmProfile) {
      throw new BadRequestException('Profil UMKM tidak ditemukan.');
    }

    return this.prisma.project.findMany({
      where: { umkmId: umkmProfile.id },
      include: {
        applications: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 6. Ambil Detail Proyek berdasarkan ID
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        umkm: {
          select: {
            companyName: true,
            industryType: true,
            phoneNumber: true,
            address: true,
          },
        },
        applications: true,
      },
    });

    if (!project) throw new NotFoundException('Proyek tidak ditemukan');
    return project;
  }

  // 7. Update Proyek (Hanya Pemilik Proyek)
  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
    const project = await this.findOne(id);

    const umkmProfile = await this.prisma.umkmProfile.findUnique({
      where: { userId },
    });

    if (!umkmProfile || project.umkmId !== umkmProfile.id) {
      throw new ForbiddenException('Anda tidak berhak mengedit proyek ini!');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        deadline: updateProjectDto.deadline
          ? new Date(updateProjectDto.deadline)
          : undefined,
      },
    });
  }

  // 8. Hapus Proyek (Hanya Pemilik Proyek)
  async remove(id: string, userId: string) {
    const project = await this.findOne(id);

    const umkmProfile = await this.prisma.umkmProfile.findUnique({
      where: { userId },
    });

    if (!umkmProfile || project.umkmId !== umkmProfile.id) {
      throw new ForbiddenException('Anda tidak berhak menghapus proyek ini!');
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }
}