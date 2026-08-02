import { IsNotEmpty, IsString } from 'class-validator';

export class CreateApplicationDto {
  @IsNotEmpty({ message: 'Project ID wajib diisi' })
  @IsString()
  projectId!: string;

  @IsNotEmpty({ message: 'Pesan penawaran (pitching) wajib diisi' })
  @IsString()
  pitchMessage!: string;
}