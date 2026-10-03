import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateMemberDto } from './create-member.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { MemberStatus } from '@prisma/client';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @ApiPropertyOptional({ enum: MemberStatus, example: MemberStatus.ACTIVE })
  @IsEnum(MemberStatus)
  @IsOptional()
  status?: MemberStatus;
}
