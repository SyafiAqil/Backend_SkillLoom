import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewApplicationDto {
  @IsNotEmpty({ message: 'Status review wajib diisi' })
  @IsString()
  @IsIn(['UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED'], {
    message: 'reviewStatus harus berupa UNDER_REVIEW, REVISION_REQUESTED, atau APPROVED',
  })
  reviewStatus!: string;

  @IsOptional()
  @IsString()
  revisionNote?: string;
}
