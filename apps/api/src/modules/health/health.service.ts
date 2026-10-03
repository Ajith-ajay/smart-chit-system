import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async health() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'UP',
      database: 'UP',
      timestamp: new Date(),
    };
  }
}
