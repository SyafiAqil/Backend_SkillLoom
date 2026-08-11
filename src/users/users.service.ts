import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSiswaProfileDto } from './dto/update-siswa-profile.dto';
import { UpdateUmkmProfileDto } from './dto/update-umkm-profile.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        siswaProfile: true,
        umkmProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateSiswaProfile(userId: string, dto: UpdateSiswaProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { siswaProfile: true },
    });

    if (!user || user.role !== Role.SISWA) {
      throw new BadRequestException('Hanya profil Siswa yang dapat diperbarui!');
    }

    if (!user.siswaProfile) {
      return this.prisma.siswaProfile.create({
        data: {
          userId,
          fullName: dto.fullName || '',
          nisn: dto.nisn || `NISN-${Date.now()}`,
          jurusan: dto.jurusan || 'Belum Diatur',
          bio: dto.bio,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
        },
      });
    }

    return this.prisma.siswaProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async updateUmkmProfile(userId: string, dto: UpdateUmkmProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { umkmProfile: true },
    });

    if (!user || user.role !== Role.UMKM) {
      throw new BadRequestException('Hanya profil UMKM yang dapat diperbarui!');
    }

    if (!user.umkmProfile) {
      return this.prisma.umkmProfile.create({
        data: {
          userId,
          companyName: dto.companyName || 'Nama Perusahaan',
          industryType: dto.industryType || 'Belum Diatur',
          phoneNumber: dto.phoneNumber || '-',
          address: dto.address,
        },
      });
    }

    return this.prisma.umkmProfile.update({
      where: { userId },
      data: dto,
    });
  }

  // ==========================================
  // FETCH ALL & DETAIL PROFIL SISWA (TALENT)
  // ==========================================
  async findAllSiswa(jurusan?: string, search?: string) {
    const whereCondition: any = {};

    if (jurusan) {
      whereCondition.jurusan = { contains: jurusan, mode: 'insensitive' };
    }

    if (search) {
      whereCondition.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { jurusan: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.siswaProfile.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true,
          },
        },
        showcases: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findSiswaById(id: string) {
    // Cari berdasarkan SiswaProfile ID atau User ID
    const siswa = await this.prisma.siswaProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isVerified: true,
          },
        },
        showcases: true,
        applications: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!siswa) {
      throw new NotFoundException('Profil Siswa tidak ditemukan!');
    }

    return siswa;
  }

  // ==========================================
  // FETCH ALL & DETAIL PROFIL UMKM
  // ==========================================
  async findAllUmkm(industryType?: string, search?: string) {
    const whereCondition: any = {};

    if (industryType) {
      whereCondition.industryType = { contains: industryType, mode: 'insensitive' };
    }

    if (search) {
      whereCondition.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { industryType: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.umkmProfile.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true,
          },
        },
        projects: {
          where: { adminApproved: true },
        },
      },
      orderBy: { companyName: 'asc' },
    });
  }

  async findUmkmById(id: string) {
    // Cari berdasarkan UmkmProfile ID atau User ID
    const umkm = await this.prisma.umkmProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isVerified: true,
          },
        },
        projects: {
          where: { adminApproved: true },
        },
      },
    });

    if (!umkm) {
      throw new NotFoundException('Profil UMKM tidak ditemukan!');
    }

    return umkm;
  }
}
