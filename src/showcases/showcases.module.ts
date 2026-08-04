import { Module } from '@nestjs/common';
import { ShowcasesController } from './showcases.controller';
import { ShowcasesService } from './showcases.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ShowcasesController],
  providers: [ShowcasesService],
  exports: [ShowcasesService],
})
export class ShowcasesModule {}
