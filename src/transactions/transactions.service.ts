import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { ApplicationStatus, PaymentStatus, ProjectStatus, Role } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  // 1. INISIASI TRANSAKSI ESCROW (UMKM)
  async create(dto: CreateTransactionDto, userId: string) {
    const umkmProfile = await this.prisma.umkmProfile.findUnique({
      where: { userId },
    });

    if (!umkmProfile) {
      throw new BadRequestException('Profil UMKM tidak ditemukan.');
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

    if (project.umkmId !== umkmProfile.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke proyek ini!');
    }

    if (project.applications.length === 0) {
      throw new BadRequestException(
        'Proyek belum memiliki pelamar yang diterima (ACCEPTED). Silakan terima pelamar terlebih dahulu.',
      );
    }

    const acceptedApplication = project.applications[0];

    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { projectId: dto.projectId },
    });

    if (existingTransaction) {
      throw new ConflictException('Transaksi untuk proyek ini sudah dibuat.');
    }

    const initialStatus = dto.paymentProof
      ? PaymentStatus.ESCROW_HELD
      : PaymentStatus.UNPAID;

    const transaction = await this.prisma.transaction.create({
      data: {
        projectId: dto.projectId,
        umkmId: umkmProfile.id,
        siswaId: acceptedApplication.siswaId,
        amount: dto.amount,
        paymentStatus: initialStatus,
        paymentProof: dto.paymentProof,
        paidAt: dto.paymentProof ? new Date() : null,
      },
      include: {
        project: true,
        umkm: true,
        siswa: true,
      },
    });

    if (initialStatus === PaymentStatus.ESCROW_HELD) {
      await this.prisma.project.update({
        where: { id: dto.projectId },
        data: { status: ProjectStatus.IN_PROGRESS },
      });
    }

    return {
      message: 'Transaksi escrow berhasil dibuat.',
      transaction,
    };
  }

  // 2. VERIFIKASI PEMBAYARAN ESCROW (UMKM / Admin)
  async holdEscrow(transactionId: string, userId: string, paymentProof?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { umkm: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan!');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    if (user.role !== Role.ADMIN && transaction.umkm.userId !== userId) {
      throw new ForbiddenException('Anda tidak berhak memperbarui transaksi ini.');
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentStatus: PaymentStatus.ESCROW_HELD,
        paymentProof: paymentProof || transaction.paymentProof,
        paidAt: new Date(),
      },
    });

    await this.prisma.project.update({
      where: { id: transaction.projectId },
      data: { status: ProjectStatus.IN_PROGRESS },
    });

    return {
      message: 'Status pembayaran berhasil diubah menjadi ESCROW_HELD.',
      transaction: updatedTransaction,
    };
  }

  // 3. CAIRKAN DANA ESCROW KE SISWA (RELEASED)
  async releaseEscrow(transactionId: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { umkm: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan!');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    if (user.role !== Role.ADMIN && transaction.umkm.userId !== userId) {
      throw new ForbiddenException('Hanya UMKM pemilik proyek atau Admin yang dapat mencairkan dana.');
    }

    if (transaction.paymentStatus !== PaymentStatus.ESCROW_HELD) {
      throw new BadRequestException('Dana hanya dapat dicairkan jika statusnya ESCROW_HELD!');
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentStatus: PaymentStatus.RELEASED,
      },
    });

    await this.prisma.project.update({
      where: { id: transaction.projectId },
      data: { status: ProjectStatus.COMPLETED },
    });

    return {
      message: 'Dana berhasil dicairkan ke Siswa! Proyek ditandai COMPLETED.',
      transaction: updatedTransaction,
    };
  }

  // 4. LIHAT HISTORI TRANSAKSI AKUN SAYA
  async findMyTransactions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { siswaProfile: true, umkmProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan!');
    }

    if (user.role === Role.UMKM && user.umkmProfile) {
      return this.prisma.transaction.findMany({
        where: { umkmId: user.umkmProfile.id },
        include: { project: true, siswa: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.SISWA && user.siswaProfile) {
      return this.prisma.transaction.findMany({
        where: { siswaId: user.siswaProfile.id },
        include: { project: true, umkm: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.ADMIN) {
      return this.prisma.transaction.findMany({
        include: { project: true, umkm: true, siswa: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return [];
  }

  // 5. DETAIL 1 TRANSAKSI
  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        project: true,
        umkm: true,
        siswa: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaksi tidak ditemukan!');
    }

    return transaction;
  }
}
