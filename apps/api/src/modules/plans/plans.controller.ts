import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { PlansService } from './plans.service';

@ApiTags('Plan Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller({ path: 'plans', version: '1' })
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({
    summary: 'List active plan templates with their fixed schedules',
  })
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one active plan template and its fixed schedule',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.plansService.findOne(id);
  }
}
