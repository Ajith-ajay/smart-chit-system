import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Member, MemberStatus, Prisma } from '@prisma/client';
import { MemberQueryDto } from './dto/member-query.dto';

@Injectable()
export class MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.MemberCreateInput): Promise<Member> {
    return this.prisma.member.create({ data });
  }

  async findAll(query: MemberQueryDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.member.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<Member | null> {
    return this.prisma.member.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async update(id: string, data: Prisma.MemberUpdateInput): Promise<Member> {
    return this.prisma.member.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Member> {
    return this.prisma.member.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: MemberStatus.INACTIVE,
      },
    });
  }

  async findByPhone(phone: string): Promise<Member | null> {
    return this.prisma.member.findFirst({
      where: {
        phone,
        deletedAt: null,
      },
    });
  }

  async findByEmail(email: string): Promise<Member | null> {
    return this.prisma.member.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }
}
