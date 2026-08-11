import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitApplicationDto {
  @IsNotEmpty({ message: 'Tautan hasil karya (submissionLink) wajib diisi' })
  @IsString()
  submissionLink!: string;
}
