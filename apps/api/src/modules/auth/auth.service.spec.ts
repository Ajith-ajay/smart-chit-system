import { Test, TestingModule } from '@nestjs/testing';

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
});
