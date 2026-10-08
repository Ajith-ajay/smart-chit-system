import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Reports & Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get financial dashboard summary' })
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  dashboard(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.dashboard(from, to);
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get batch financial dashboard' })
  batch(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.batch(id);
  }

  @Get('enrollments/:id')
  @ApiOperation({ summary: 'Get member enrollment financial ledger' })
  enrollment(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.enrollment(id);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get collection transaction report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  collection(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.collection(from, to);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Get withdrawal and payout report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  withdrawals(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.withdrawals(from, to);
  }
}
