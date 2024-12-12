import { Controller, Get, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { User } from '../model/user';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { RolesGuard } from '../guard/rolesGuard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Get a list of all users with pagination and search' })
  @ApiQuery({ name: 'nameQuery', description: 'Name query for full-text search', required: false, type: String })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false, type: Number })
  @ApiQuery({ name: 'size', description: 'Number of items per page', required: false, type: Number })
  getAllUsers(@Param('nameQuery') nameQuery: string, @Query('page') page: number, @Query('size') size: number) {
    // todo: returns a list of all users with pagination and name param for a full-text search
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user profile by ID' })
  @ApiParam({ name: 'id', description: 'ID of the user', type: String })
  getUserById(@Param('id') id: string) {
    // todo: returns a specific user profile
  }

  @Put(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user information by ID' })
  @ApiParam({ name: 'id', description: 'ID of the user to update', type: String })
  @ApiBody({ description: 'Updated user information', type: User })
  updateUser(@Param('id') id: string, @Body() updateUserDto: User) {
    // todo: updates a user's information
  }

  @Delete(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', description: 'ID of the user to delete', type: String })
  deleteUser(@Param('id') id: string) {
    // todo: deletes a user
  }
}
