import { Body, Controller, Get, Post, UseGuards, Req, Res, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterSiswaDto } from './dto/register-siswa.dto';
import { RegisterUmkmDto } from './dto/register-umkm.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import express from 'express';



@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register/siswa')
  async registerSiswa(@Body() dto: RegisterSiswaDto) {
    return this.authService.registerSiswa(dto);
  }

  @Post('register/umkm')
  async registerUmkm(@Body() dto: RegisterUmkmDto) {
    return this.authService.registerUmkm(dto);
  }

  @Post('register/admin')
  async registerAdmin(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }


  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    // Ambil role dari state OAuth Google
    let role: 'SISWA' | 'UMKM' = 'SISWA';
    if (req.query.state) {
      try {
        const stateObj = JSON.parse(req.query.state);
        role = stateObj.role || 'SISWA';
      } catch (e) {
        role = 'SISWA';
      }
    }

    const result = await this.authService.validateGoogleUser(req.user, role);
    return res.json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@GetUser() user: any) {
    return {
      message: 'Akses diterima! Ini data token Anda.',
      user,
    };
  }

}