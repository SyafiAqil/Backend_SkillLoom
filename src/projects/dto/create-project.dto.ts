import { IsNotEmpty, IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty({ message: 'Judul proyek wajib diisi' })
  @IsString()
  title!: string;

  @IsNotEmpty({ message: 'Deskripsi proyek wajib diisi' })
  @IsString()
  description!: string;

  @IsNotEmpty({ message: 'Kategori jurusan wajib diisi' })
  @IsString()
  category!: string; // Contoh: "RPL", "DKV"

  @IsNotEmpty({ message: 'Budget wajib diisi' })
  @IsNumber({}, { message: 'Budget harus berupa angka' })
  @Min(0, { message: 'Budget tidak boleh negatif' })
  budget!: number;

  @IsNotEmpty({ message: 'Deadline wajib diisi' })
  @IsDateString({}, { message: 'Format tanggal deadline tidak valid (Gunakan format YYYY-MM-DD)' })
  deadline!: string;
}