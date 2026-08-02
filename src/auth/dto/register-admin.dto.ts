import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterAdminDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @IsNotEmpty({ message: 'Nama sekolah wajib diisi' })
  @IsString()
  schoolName!: string;

  @IsNotEmpty({ message: 'Jabatan/Posisi wajib diisi' })
  @IsString()
  position!: string;
}