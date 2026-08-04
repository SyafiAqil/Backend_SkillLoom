import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // 🔒 POST /transactions -> UMKM membuat transaksi escrow
  @UseGuards(RolesGuard)
  @Roles(Role.UMKM)
  @Post()
  create(
    @Body() dto: CreateTransactionDto,
    @GetUser('sub') userId: string,
  ) {
    return this.transactionsService.create(dto, userId);
  }

  // 🔒 GET /transactions/my -> Histori transaksi akun saya
  @Get('my')
  findMyTransactions(@GetUser('sub') userId: string) {
    return this.transactionsService.findMyTransactions(userId);
  }

  // 🔒 GET /transactions/:id -> Detail 1 transaksi
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ) {
    return this.transactionsService.findOne(id, userId);
  }

  // 🔒 PATCH /transactions/:id/hold -> Set status ESCROW_HELD (UMKM / Admin)
  @Patch(':id/hold')
  holdEscrow(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionStatusDto,
    @GetUser('sub') userId: string,
  ) {
    return this.transactionsService.holdEscrow(id, userId, dto.paymentProof);
  }

  // 🔒 PATCH /transactions/:id/release -> Pencairan dana ke Siswa (UMKM / Admin)
  @Patch(':id/release')
  releaseEscrow(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ) {
    return this.transactionsService.releaseEscrow(id, userId);
  }
}
