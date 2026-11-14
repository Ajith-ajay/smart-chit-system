import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'node:crypto';

import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

import { TokenService } from '@/common/token/token.service';
import { PasswordService } from '@/common/security/password.service';
import { MailService } from '@/common/mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;

  const authRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
    rotateRefreshTokenHash: jest.fn(),
    createPasswordResetToken: jest.fn(),
    deletePasswordResetTokens: jest.fn(),
    findPasswordResetToken: jest.fn(),
    resetPassword: jest.fn(),
  };

  const tokenService = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    generatePasswordResetToken: jest.fn(),
    verifyPasswordResetToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  const passwordService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mailService = {
    send: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,

        {
          provide: AuthRepository,
          useValue: authRepository,
        },

        {
          provide: TokenService,
          useValue: tokenService,
        },

        {
          provide: PasswordService,
          useValue: passwordService,
        },

        {
          provide: MailService,
          useValue: mailService,
        },

        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('refreshToken', () => {
    const currentRefreshToken = 'current-refresh-token';
    const currentHash = createHash('sha256')
      .update(currentRefreshToken)
      .digest('hex');

    const user = {
      id: 'user-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      isActive: true,
      refreshTokenHash: currentHash,
    };

    beforeEach(() => {
      tokenService.verifyRefreshToken.mockResolvedValue({
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
      });
      authRepository.findById.mockResolvedValue(user);
      tokenService.generateAccessToken.mockResolvedValue('new-access-token');
      tokenService.generateRefreshToken.mockResolvedValue('new-refresh-token');
      authRepository.rotateRefreshTokenHash.mockResolvedValue(true);
    });

    it('verifies and rotates the refresh token', async () => {
      await expect(
        service.refreshToken({ refreshToken: currentRefreshToken }),
      ).resolves.toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        'current-refresh-token',
      );
      expect(authRepository.rotateRefreshTokenHash).toHaveBeenCalledWith(
        user.id,
        currentHash,
        createHash('sha256').update('new-refresh-token').digest('hex'),
      );
    });

    it('rejects an inactive account', async () => {
      authRepository.findById.mockResolvedValue({
        ...user,
        isActive: false,
      });

      await expect(
        service.refreshToken({ refreshToken: 'current-refresh-token' }),
      ).rejects.toThrow('Invalid refresh token');

      expect(authRepository.rotateRefreshTokenHash).not.toHaveBeenCalled();
    });

    it('rejects a refresh token that does not match the stored hash', async () => {
      await expect(
        service.refreshToken({ refreshToken: 'reused-refresh-token' }),
      ).rejects.toThrow('Invalid refresh token');

      expect(authRepository.rotateRefreshTokenHash).not.toHaveBeenCalled();
    });

    it('rejects a concurrent refresh when another request already rotated the token', async () => {
      authRepository.rotateRefreshTokenHash.mockResolvedValue(false);

      await expect(
        service.refreshToken({ refreshToken: 'current-refresh-token' }),
      ).rejects.toThrow('Refresh token has already been used');
    });
  });
});
