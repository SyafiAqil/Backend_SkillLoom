import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateApplicationDto {
    @IsNotEmpty({ message: 'Pesan penawaran (pitching) wajib diisi' })
    @IsString()
    pitchMessage!: string;
}