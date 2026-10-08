import { ReminderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateReminderStatusDto {
  @IsEnum(ReminderStatus)
  status!: ReminderStatus;
}
