import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from '../model/user';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
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
