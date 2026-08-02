import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  password!: string;
}