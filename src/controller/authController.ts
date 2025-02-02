import { Controller, Post, Body, Logger, Inject, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from '../model/user';
import { AuthService } from '../service/authService';
import { AuthGuard } from '../common/guard/authGuard';
import { Token } from '../common/decorator/TokenDecorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger: Logger = new Logger(AuthController.name);
  private readonly authService: AuthService;

  constructor(@Inject() authService: AuthService) {
    this.authService = authService
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return a JWT' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  login(@Body() credentials: { email: string, password: string }) {
    this.logger.log('POST /login | Authenticating user with credentials')
    //returns JWT
    return this.authService.login(credentials.email, credentials.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Log out the current user' })
  logout(@Token() token: string) {
    this.logger.log('POST /logout');
    return this.authService.logout(token);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: User })
  signup(@Body() user: User) {
    this.logger.log('POST /signup')
    return this.authService.signup(user);
  }
}
