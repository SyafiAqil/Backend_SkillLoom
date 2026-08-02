import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterSiswaDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  @IsString()
  fullName!: string;

  @IsNotEmpty({ message: 'NISN wajib diisi' })
  @IsString()
  nisn!: string;

  @IsNotEmpty({ message: 'Jurusan wajib diisi' })
  @IsString()
  jurusan!: string; // RPL / DKV
}