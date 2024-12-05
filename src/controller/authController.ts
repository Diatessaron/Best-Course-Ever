import { Controller, Post, Body } from '@nestjs/common';
import { User } from '../model/user';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() credentials: { email: string; password: string }) {
    // todo: authenticates a user and returns a jwt
  }

  @Post('logout')
  logout() {
    // todo: logs out the current user
  }

  @Post()
  signup(@Body() user: User) {
    // todo: creates a new user
  }
}
