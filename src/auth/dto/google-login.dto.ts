import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsNotEmpty({ message: 'Token Google wajib diisi' })
  @IsString()
  token!: string;

  @IsOptional()
  @IsString()
  @IsIn(['SISWA', 'UMKM'], { message: 'Role harus SISWA atau UMKM' })
  role?: 'SISWA' | 'UMKM';
}
