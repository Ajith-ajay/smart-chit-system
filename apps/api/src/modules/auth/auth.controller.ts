import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import {
  ApiChangePassword,
  ApiCurrentUser,
  ApiForgotPassword,
  ApiLogin,
  ApiLogout,
  ApiResetPassword,
  ApiSignup,
} from './auth.swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { ForgotPasswordDto } from './dto/requests/forgot-password.dto';
import { LoginDto } from './dto/requests/login.dto';
import { RefreshTokenDto } from './dto/requests/refresh-token.dto';
import { ResetPasswordDto } from './dto/requests/reset-password.dto';
import { SignupDto } from './dto/requests/signup.dto';
import { ForgotPasswordResponseDto } from './dto/responses/forgot-password.response.dto';
import { LoginResponseDto } from './dto/responses/login.response.dto';
import { LogoutResponseDto } from './dto/responses/logout.response.dto';
import { RefreshTokenResponseDto } from './dto/responses/refresh-token.response.dto';
import { ResetPasswordResponseDto } from './dto/responses/reset-password.response.dto';
import { SignupResponseDto } from './dto/responses/signup.response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiCurrentUser()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @ApiSignup()
  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<SignupResponseDto> {
    return this.authService.signup(signupDto);
  }

  @ApiLogin()
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(dto);
  }

  @ApiChangePassword()
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(user.id, changePasswordDto);
  }

  @ApiForgotPassword()
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @ApiResetPassword()
  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(dto);
  }

  @ApiLogout()
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LogoutResponseDto> {
    return this.authService.logout(user.id);
  }
}
