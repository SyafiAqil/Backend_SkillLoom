import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterUmkmDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @IsNotEmpty({ message: 'Nama perusahaan/usaha wajib diisi' })
  @IsString()
  companyName!: string;

  @IsNotEmpty({ message: 'Jenis industri wajib diisi' })
  @IsString()
  industryType!: string;

  @IsNotEmpty({ message: 'Nomor telepon/WhatsApp wajib diisi' })
  @IsString()
  phoneNumber!: string;
}