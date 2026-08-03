import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateStatusDto {
    @IsNotEmpty({ message: 'Status wajib diisi' })
    @IsEnum(ApplicationStatus, { message: 'Status harus ACCEPTED atau REJECTED' })
    status!: ApplicationStatus;
}