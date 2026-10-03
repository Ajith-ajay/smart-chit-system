import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { ForgotPasswordDto } from './dto/requests/forgot-password.dto';
import { LoginDto } from './dto/requests/login.dto';
import { ResetPasswordDto } from './dto/requests/reset-password.dto';
import { SignupDto } from './dto/requests/signup.dto';
import { ForgotPasswordResponseDto } from './dto/responses/forgot-password.response.dto';
import { LoginResponseDto } from './dto/responses/login.response.dto';
import { LogoutResponseDto } from './dto/responses/logout.response.dto';
import { ResetPasswordResponseDto } from './dto/responses/reset-password.response.dto';

export function ApiSignup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description:
        'Register a new user with email, password, and other details.',
    }),
    ApiBody({
      type: SignupDto,
    }),
    ApiOkResponse({
      description: 'User registered successfully.',
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid input data.',
    }),
  );
}

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Authenticate user',
      description: 'Authenticate using email and password.',
    }),
    ApiBody({
      type: LoginDto,
    }),
    ApiOkResponse({
      type: LoginResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid credentials.',
    }),
  );
}

export function ApiCurrentUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get current authenticated user',
    }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Logout current session',
    }),
    ApiOkResponse({
      type: LogoutResponseDto,
    }),
  );
}

export function ApiForgotPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Request password reset',
    }),
    ApiBody({
      type: ForgotPasswordDto,
    }),
    ApiOkResponse({
      type: ForgotPasswordResponseDto,
    }),
  );
}

export function ApiResetPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reset password',
    }),
    ApiBody({
      type: ResetPasswordDto,
    }),
    ApiOkResponse({
      type: ResetPasswordResponseDto,
    }),
  );
}

export function ApiChangePassword() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Change password',
    }),
    ApiBody({
      type: ChangePasswordDto,
    }),
  );
}
