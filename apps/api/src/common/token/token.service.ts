import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import type { JwtPayload } from '@/common/token/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async generateAccessToken(payload: JwtPayload) {
    return this.signToken(
      payload,
      this.config.getOrThrow<string>('jwt.accessSecret'),
      this.config.getOrThrow<string>('jwt.accessExpiresIn'),
    );
  }

  async generateRefreshToken(payload: JwtPayload) {
    return this.signToken(
      payload,
      this.config.getOrThrow<string>('jwt.refreshSecret'),
      this.config.getOrThrow<string>('jwt.refreshExpiresIn'),
    );
  }

  async generatePasswordResetToken(payload: JwtPayload) {
    return this.signToken(
      payload,
      this.config.getOrThrow<string>('jwt.passwordResetSecret'),
      this.config.getOrThrow<string>('jwt.passwordResetExpiresIn'),
    );
  }

  async verifyPasswordResetToken(token: string): Promise<JwtPayload> {
    const payload: JwtPayload = await this.jwtService.verifyAsync<JwtPayload>(
      token,
      {
        secret: this.config.getOrThrow<string>('jwt.passwordResetSecret'),
      },
    );

    if (payload.type !== 'password-reset') {
      throw new UnauthorizedException('Invalid reset token');
    }

    return payload;
  }

  private async signToken(
    payload: JwtPayload,
    secret: string,
    expiresIn: string,
  ) {
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expiresIn as StringValue,
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
    });
  }
}
