import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TokenService } from '@/common/token/token.service';
import { MailService } from '@/common/mail/mail.service';
import { PasswordService } from '@/common/security/password.service';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/requests/login.dto';
import { LoginResponseDto } from './dto/responses/login.response.dto';
import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { ForgotPasswordDto } from './dto/requests/forgot-password.dto';
import { ForgotPasswordResponseDto } from './dto/responses/forgot-password.response.dto';
import { ResetPasswordDto } from './dto/requests/reset-password.dto';
import { ResetPasswordResponseDto } from './dto/responses/reset-password.response.dto';
import { LogoutResponseDto } from './dto/responses/logout.response.dto';
import { RefreshTokenDto } from './dto/requests/refresh-token.dto';
import { RefreshTokenResponseDto } from './dto/responses/refresh-token.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.passwordService.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.tokenService.generateAccessToken(payload);

    const refreshToken = await this.tokenService.generateRefreshToken(payload);

    const refreshTokenHash = await this.passwordService.hash(refreshToken, 12);

    await this.authRepository.updateRefreshTokenHash(user.id, refreshTokenHash);

    const response: LoginResponseDto = {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };

    return response;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentPasswordMatches = await this.passwordService.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await this.passwordService.compare(
      changePasswordDto.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const passwordHash = await this.passwordService.hash(
      changePasswordDto.newPassword,
      12,
    );

    await this.authRepository.changePassword(userId, passwordHash);
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    const response = {
      message:
        'If an account exists for this email, a password reset link has been sent.',
    };

    const user = await this.authRepository.findByEmail(dto.email);

    if (!user) {
      return response;
    }

    await this.authRepository.deletePasswordResetTokens(user.id);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const resetRequest = await this.authRepository.createPasswordResetToken(
      user.id,
      expiresAt,
    );

    const token = await this.tokenService.generatePasswordResetToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'password-reset',
      jti: resetRequest.id,
    });

    const resetUrl = `${this.configService.getOrThrow<string>('app.url')}/reset-password?token=${token}`;

    await this.mailService.send({
      to: user.email,
      subject: 'Reset your password',
      template: 'forgot-password',
      context: {
        name: `${user.firstName} ${user.lastName}`,
        resetUrl,
      },
    });

    return response;
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    const payload = await this.tokenService.verifyPasswordResetToken(dto.token);

    if (!payload.jti) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const resetToken = await this.authRepository.findPasswordResetToken(
      payload.jti,
    );

    if (!resetToken) {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword, 12);

    await this.authRepository.updatePassword(resetToken.userId, passwordHash);

    await this.authRepository.markPasswordResetTokenAsUsed(resetToken.id);

    return {
      message: 'Password reset successfully.',
    };
  }

  async logout(userId: string): Promise<LogoutResponseDto> {
    await this.authRepository.updateRefreshTokenHash(userId, null);

    return {
      message: 'Logged out successfully.',
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const payload = await this.tokenService.verifyRefreshToken(
      dto.refreshToken,
    );

    const user = await this.authRepository.findById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const matches = await this.passwordService.compare(
      dto.refreshToken,
      user.refreshTokenHash,
    );

    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.tokenService.generateAccessToken(jwtPayload);

    const refreshToken =
      await this.tokenService.generateRefreshToken(jwtPayload);

    const refreshTokenHash = await this.passwordService.hash(refreshToken, 12);

    await this.authRepository.updateRefreshTokenHash(user.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
    };
  }
}
