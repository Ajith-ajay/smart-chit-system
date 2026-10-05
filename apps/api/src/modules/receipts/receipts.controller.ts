import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/authenticated-user.interface';
import { CancelReceiptDto } from './dto/cancel-receipt.dto';
import { ReceiptsService } from './receipts.service';

@ApiTags('Receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
@Controller({ path: 'receipts', version: '1' })
export class ReceiptsController {
  constructor(private readonly service: ReceiptsService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get a receipt with payment and allocation details',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Get('payments/:paymentId')
  @ApiOperation({ summary: 'List all receipts issued for a payment' })
  byPayment(@Param('paymentId', new ParseUUIDPipe()) paymentId: string) {
    return this.service.byPayment(paymentId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a receipt without deleting it' })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancel(id, dto, user.id);
  }

  @Post(':id/reissue')
  @ApiOperation({
    summary: 'Issue a new receipt after cancelling the previous receipt',
  })
  reissue(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reissue(id, user.id);
  }
}
