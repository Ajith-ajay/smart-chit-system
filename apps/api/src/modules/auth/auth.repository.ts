import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
      },
    });
  }

  async changePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
        refreshTokenHash: null,
      },
    });
  }

  async findValidPasswordResetToken(userId: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: {
        userId,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findActivePasswordResetTokens() {
    return this.prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async createPasswordResetToken(userId: string, expiresAt: Date) {
    return this.prisma.passwordResetToken.create({
      data: {
        userId,
        expiresAt,
      },
    });
  }

  async findPasswordResetToken(id: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });
  }

  async markPasswordResetTokenAsUsed(id: string) {
    return this.prisma.passwordResetToken.update({
      where: {
        id,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  async deletePasswordResetTokens(userId: string) {
    return this.prisma.passwordResetToken.deleteMany({
      where: {
        userId,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
        refreshTokenHash: null,
      },
    });
  }
}
