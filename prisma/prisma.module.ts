import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // @Global agar service ini bisa dipakai di semua modul lain tanpa re-import
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}