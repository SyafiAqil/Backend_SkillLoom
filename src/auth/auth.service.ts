import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterSiswaDto } from './dto/register-siswa.dto';
import { RegisterUmkmDto } from './dto/register-umkm.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  // 1. REGISTER SISWA
  async registerSiswa(dto: RegisterSiswaDto) {
    await this.checkEmailExists(dto.email);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        role: Role.SISWA,
        siswaProfile: {
          create: {
            fullName: dto.fullName,
            nisn: dto.nisn,
            jurusan: dto.jurusan,
          },
        },
      },
      include: { siswaProfile: true },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return { message: 'Registrasi Siswa berhasil!', user: userWithoutPassword };
  }

  // 2. REGISTER UMKM
  async registerUmkm(dto: RegisterUmkmDto) {
    await this.checkEmailExists(dto.email);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        role: Role.UMKM,
        umkmProfile: {
          create: {
            companyName: dto.companyName,
            industryType: dto.industryType,
            phoneNumber: dto.phoneNumber,
          },
        },
      },
      include: { umkmProfile: true },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return { message: 'Registrasi UMKM berhasil!', user: userWithoutPassword };
  }

  // 3. REGISTER ADMIN (GURU)
  async registerAdmin(dto: RegisterAdminDto) {
    await this.checkEmailExists(dto.email);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        role: Role.ADMIN,
        adminProfile: {
          create: {
            schoolName: dto.schoolName,
            position: dto.position,
          },
        },
      },
      include: { adminProfile: true },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return { message: 'Registrasi Admin/Guru berhasil!', user: userWithoutPassword };
  }

  // HELPER CHECK EMAIL
  private async checkEmailExists(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email sudah terdaftar!');
  }

  // Tambahkan method ini di dalam AuthService
  // Ganti method validateGoogleUser dengan kode di bawah ini:
  async validateGoogleUser(
    googleUser: { email: string; firstName: string; lastName: string },
    targetRole: 'SISWA' | 'UMKM' = 'SISWA', // 👈 Tambahkan parameter targetRole ini
  ) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    // Jika user belum terdaftar, buatkan user baru berdasarkan targetRole yang dikirim
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          passwordHash: '', // Login via OAuth tidak memerlukan password
          role: targetRole,  // 👈 Gunakan targetRole dari parameter
          isVerified: true,
        },
      });

      // Buat profil sesuai dengan role yang dipilih
      if (targetRole === 'UMKM') {
        await this.prisma.umkmProfile.create({
          data: {
            userId: user.id,
            companyName: `${googleUser.firstName}'s Business`,
            industryType: 'Belum Diatur',
            phoneNumber: '-',
            address: '-',
          },
        });
      } else {
        await this.prisma.siswaProfile.create({
          data: {
            userId: user.id,
            fullName: `${googleUser.firstName} ${googleUser.lastName}`.trim(),
            nisn: `G-${Date.now()}`, // Identifier sementara
            jurusan: 'Belum Diatur',
          },
        });
      }
    }

    // Generate JWT Token standar aplikasi
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // 4. GOOGLE LOGIN VIA POST (FRONTEND TOKEN SDK / CREDENTIAL)
  async googleLoginPost(dto: GoogleLoginDto) {
    let googleUserData: { email: string; firstName: string; lastName: string };

    try {
      // 1. Coba verifikasi sebagai ID Token (Google OAuth 2.0 Credential / ID Token)
      const tokenInfoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${dto.token}`,
      );

      if (tokenInfoRes.ok) {
        const payload = await tokenInfoRes.json();
        googleUserData = {
          email: payload.email,
          firstName: payload.given_name || payload.name || 'User',
          lastName: payload.family_name || '',
        };
      } else {
        // 2. Fallback: Coba verifikasi sebagai Access Token (Google UserInfo API)
        const userInfoRes = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${dto.token}` },
          },
        );

        if (!userInfoRes.ok) {
          throw new UnauthorizedException(
            'Token Google tidak valid atau telah kedaluwarsa!',
          );
        }

        const payload = await userInfoRes.json();
        googleUserData = {
          email: payload.email,
          firstName: payload.given_name || payload.name || 'User',
          lastName: payload.family_name || '',
        };
      }
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(
        'Gagal memverifikasi token Google: ' +
          (error.message || 'Terjadi kesalahan jaringan'),
      );
    }

    const targetRole = dto.role || 'SISWA';
    const result = await this.validateGoogleUser(googleUserData, targetRole);

    return {
      message: 'Login Google berhasil!',
      ...result,
    };
  }

  // LOGIKA LOGIN
  async login(dto: LoginDto) {
    // 1. Cari user berdasarkan email beserta semua profil yang terkait
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        siswaProfile: true,
        umkmProfile: true,
        adminProfile: true,
      },
    });

    // 2. Jika user tidak ditemukan, lempar error 401 Unauthorized
    if (!user) {
      throw new UnauthorizedException('Email atau password salah!');
    }

    // 3. Verifikasi password hash
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah!');
    }

    // 4. Siapkan payload data untuk JWT Token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // 5. Generate Access Token
    const token = await this.jwtService.signAsync(payload);

    // 6. Pisahkan passwordHash dari objek user agar tidak ikut terkirim ke client
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      message: 'Login berhasil!',
      access_token: token,
      user: userWithoutPassword,
    };

  }
}
