import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, ReminderStatus, ReminderType } from '@prisma/client';
import { CompleteFollowUpDto } from './dto/complete-follow-up.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderStatusDto } from './dto/update-reminder-status.dto';
import { RemindersRepository } from './reminders.repository';

@Injectable()
export class RemindersService {
  constructor(private readonly repository: RemindersRepository) {}

  async createReminder(
    enrollmentId: string,
    dto: CreateReminderDto,
    userId: string,
  ) {
    const enrollment = await this.repository.findEnrollment(enrollmentId);
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    if (dto.type !== ReminderType.WHATSAPP) {
      throw new UnprocessableEntityException(
        'Only WhatsApp reminders are enabled in the current release.',
      );
    }
    if (dto.batchInstallmentId)
      await this.validateInstallment(enrollmentId, dto.batchInstallmentId);
    return this.repository.createReminder(
      {
        enrollmentId,
        batchInstallmentId: dto.batchInstallmentId,
        scheduledDate: new Date(dto.scheduledDate),
        type: dto.type,
        message: dto.message.trim(),
      },
      userId,
    );
  }

  async updateReminderStatus(
    id: string,
    dto: UpdateReminderStatusDto,
    userId: string,
  ) {
    const reminder = await this.repository.findReminder(id);
    if (!reminder) throw new NotFoundException('Reminder not found.');
    if (
      reminder.status === ReminderStatus.SENT &&
      dto.status !== ReminderStatus.SENT
    ) {
      throw new ConflictException(
        'A sent reminder cannot be moved back to another status.',
      );
    }
    if (
      reminder.status === ReminderStatus.CANCELLED &&
      dto.status !== ReminderStatus.CANCELLED
    ) {
      throw new ConflictException('A cancelled reminder cannot be reopened.');
    }
    return this.repository.updateReminderStatus(id, dto.status, userId);
  }

  listReminders(enrollmentId?: string, status?: ReminderStatus) {
    const where: Prisma.ReminderWhereInput = {};
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (status) where.status = status;
    return this.repository.listReminders(where);
  }

  async createFollowUp(
    enrollmentId: string,
    dto: CreateFollowUpDto,
    userId: string,
  ) {
    const enrollment = await this.repository.findEnrollment(enrollmentId);
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    if (dto.batchInstallmentId)
      await this.validateInstallment(enrollmentId, dto.batchInstallmentId);
    return this.repository.createFollowUp(
      {
        enrollmentId,
        memberId: enrollment.memberId,
        batchInstallmentId: dto.batchInstallmentId,
        type: dto.type,
        status: dto.status,
        notes: dto.notes?.trim(),
        followUpDate: new Date(dto.followUpDate),
        createdById: userId,
      },
      userId,
    );
  }

  listFollowUps(enrollmentId?: string, memberId?: string, onlyOpen = false) {
    const where: Prisma.FollowUpWhereInput = {};
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (memberId) where.memberId = memberId;
    if (onlyOpen) where.completedAt = null;
    return this.repository.listFollowUps(where);
  }

  async completeFollowUp(id: string, dto: CompleteFollowUpDto, userId: string) {
    const followUp = await this.repository.findFollowUp(id);
    if (!followUp) throw new NotFoundException('Follow-up not found.');
    if (followUp.completedAt)
      throw new ConflictException('Follow-up is already completed.');
    return this.repository.completeFollowUp(id, dto.notes, userId);
  }

  private async validateInstallment(
    enrollmentId: string,
    installmentId: string,
  ) {
    const installment = await this.repository.findInstallment(installmentId);
    if (!installment)
      throw new NotFoundException('Batch installment not found.');
    if (
      installment.batchPlanId !==
      (await this.repository.findEnrollment(enrollmentId))?.batchPlanId
    ) {
      throw new UnprocessableEntityException(
        'Batch installment does not belong to the enrollment plan.',
      );
    }
  }
}
