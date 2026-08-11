import { Body, Controller, Get, Post, UseGuards, Req, Res, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterSiswaDto } from './dto/register-siswa.dto';
import { RegisterUmkmDto } from './dto/register-umkm.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
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

  // 🔒 POST /auth/google -> Frontend SDK / Direct Token Exchange
  @Post('google')
  async googleAuthPost(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLoginPost(dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard) // atau UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    // 1. Fitur Kode Pertama: Ambil role dari state OAuth Google
    let role: 'SISWA' | 'UMKM' = 'SISWA';
    if (req.query.state) {
      try {
        const stateObj = JSON.parse(req.query.state);
        role = stateObj.role || 'SISWA';
      } catch (e) {
        role = 'SISWA';
      }
    }

    // 2. Fitur Kode Pertama: Validasi user dengan parameter req.user & role
    const result = await this.authService.validateGoogleUser(req.user, role);

    // 3. Fitur Kode Kedua: Ambil URL Frontend dari Environment Variable
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // 4. Fitur Kode Kedua: Redirect otomatis ke Frontend membawa token dan role
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${result.access_token}&role=${result.user.role}`
    );
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