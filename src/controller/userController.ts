import { Controller, Get, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { User } from '../model/user';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { RolesGuard } from '../guard/rolesGuard';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  @Get()
  getAllUsers(@Param('nameQuery') nameQuery: string, @Query('page') page: number, @Query('size') size: number) {
    // todo: returns a list of all users with pagination and name param for a full-text search
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    // todo: returns a specific user profile
  }

  @Put(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  updateUser(@Param('id') id: string, @Body() updateUserDto: User) {
    // todo: updates a user's information
  }

  @Delete(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  deleteUser(@Param('id') id: string) {
    // todo: deletes a user
  }
}
