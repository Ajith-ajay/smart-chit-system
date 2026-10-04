import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Member, Prisma } from '@prisma/client';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberQueryDto } from './dto/member-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersRepository } from './members.repository';

@Injectable()
export class MembersService {
  constructor(private readonly membersRepository: MembersRepository) {}

  async create(dto: CreateMemberDto): Promise<Member> {
    const existingPhone = await this.membersRepository.findByPhone(dto.phone);
    if (existingPhone) {
      throw new ConflictException(
        `Phone number ${dto.phone} is already registered`,
      );
    }

    if (dto.email) {
      const existingEmail = await this.membersRepository.findByEmail(dto.email);
      if (existingEmail) {
        throw new ConflictException(
          `Email address ${dto.email} is already registered`,
        );
      }
    }

    return this.membersRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email || null,
      nomineeDetails: dto.nomineeDetails ?? Prisma.JsonNull,
      bankDetails: dto.bankDetails ?? Prisma.JsonNull,
      remarks: dto.remarks || null,
    });
  }

  async findAll(query: MemberQueryDto) {
    return this.membersRepository.findAll(query);
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.membersRepository.findById(id);
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }
    return member;
  }

  async update(id: string, dto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);

    if (dto.phone && dto.phone !== member.phone) {
      const existingPhone = await this.membersRepository.findByPhone(dto.phone);
      if (existingPhone && existingPhone.id !== id) {
        throw new ConflictException(
          `Phone number ${dto.phone} is already registered`,
        );
      }
    }

    if (dto.email && dto.email !== member.email) {
      const existingEmail = await this.membersRepository.findByEmail(dto.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException(
          `Email address ${dto.email} is already registered`,
        );
      }
    }

    return this.membersRepository.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email !== undefined ? dto.email : undefined,
      status: dto.status,
      nomineeDetails:
        dto.nomineeDetails !== undefined ? dto.nomineeDetails : undefined,
      bankDetails: dto.bankDetails !== undefined ? dto.bankDetails : undefined,
      remarks: dto.remarks !== undefined ? dto.remarks : undefined,
    });
  }

  async remove(id: string): Promise<Member> {
    await this.findOne(id);
    return this.membersRepository.softDelete(id);
  }
}
