import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateSiswaProfileDto } from './dto/update-siswa-profile.dto';
import { UpdateUmkmProfileDto } from './dto/update-umkm-profile.dto';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@GetUser('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SISWA)
  @Patch('profile/siswa')
  updateSiswaProfile(
    @GetUser('sub') userId: string,
    @Body() dto: UpdateSiswaProfileDto,
  ) {
    return this.usersService.updateSiswaProfile(userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.UMKM)
  @Patch('profile/umkm')
  updateUmkmProfile(
    @GetUser('sub') userId: string,
    @Body() dto: UpdateUmkmProfileDto,
  ) {
    return this.usersService.updateUmkmProfile(userId, dto);
  }
}
