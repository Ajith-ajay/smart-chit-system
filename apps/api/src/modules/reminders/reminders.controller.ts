import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ReminderStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/authenticated-user.interface';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderStatusDto } from './dto/update-reminder-status.dto';
import { CompleteFollowUpDto } from './dto/complete-follow-up.dto';
import { RemindersService } from './reminders.service';
import { ReminderDispatcherService } from './reminder-dispatcher.service';

@ApiTags('Reminders & Follow-ups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
@Controller({ path: 'reminders', version: '1' })
export class RemindersController {
  constructor(
    private readonly service: RemindersService,
    private readonly dispatcher: ReminderDispatcherService,
  ) {}

  @Post('enrollments/:enrollmentId')
  @ApiOperation({ summary: 'Create a payment reminder for an enrollment' })
  createReminder(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Body() dto: CreateReminderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createReminder(enrollmentId, dto, user.id);
  }

  @Post('dispatch-due')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Send due WhatsApp reminders' })
  dispatchDue() {
    return this.dispatcher.dispatchDue();
  }

  @Get()
  @ApiOperation({ summary: 'List reminders' })
  @ApiQuery({ name: 'enrollmentId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ReminderStatus })
  list(
    @Query('enrollmentId') enrollmentId?: string,
    @Query('status') status?: ReminderStatus,
  ) {
    return this.service.listReminders(enrollmentId, status);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update reminder status' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReminderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateReminderStatus(id, dto, user.id);
  }

  @Post('enrollments/:enrollmentId/follow-ups')
  @ApiOperation({ summary: 'Record a collection follow-up' })
  createFollowUp(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Body() dto: CreateFollowUpDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createFollowUp(enrollmentId, dto, user.id);
  }

  @Get('follow-ups')
  @ApiOperation({ summary: 'List collection follow-ups' })
  @ApiQuery({ name: 'enrollmentId', required: false })
  @ApiQuery({ name: 'memberId', required: false })
  @ApiQuery({ name: 'onlyOpen', required: false, type: Boolean })
  listFollowUps(
    @Query('enrollmentId') enrollmentId?: string,
    @Query('memberId') memberId?: string,
    @Query('onlyOpen') onlyOpen = false,
  ) {
    return this.service.listFollowUps(
      enrollmentId,
      memberId,
      onlyOpen === true || String(onlyOpen) === 'true',
    );
  }

  @Post('follow-ups/:id/complete')
  @ApiOperation({ summary: 'Complete a collection follow-up' })
  completeFollowUp(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CompleteFollowUpDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.completeFollowUp(id, dto, user.id);
  }
}
