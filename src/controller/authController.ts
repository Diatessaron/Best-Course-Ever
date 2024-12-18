import { Controller, Post, Body, Logger, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from '../model/user';
import { AuthService } from '../service/authService';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private logger: Logger = new Logger(AuthController.name);
  private authService: AuthService;

  constructor(@Inject() authService: AuthService) {
    this.authService = authService
  }

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
  login(@Body() credentials: { email: string; password: string }) {
    // todo: authenticates a user and returns a jwt
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out the current user' })
  logout() {
    // todo: logs out the current user
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: User })
  signup(@Body() user: User) {
    // todo: creates a new user
  }
}
