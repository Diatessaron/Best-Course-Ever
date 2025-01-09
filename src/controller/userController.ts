import {
  Controller, Get, Put, Delete, Param, Body, UseGuards, Query, Inject, BadRequestException, Logger, ParseIntPipe,
} from '@nestjs/common';
import { User } from '../model/user';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { RolesGuard } from '../guard/rolesGuard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserService } from '../service/userService';
import { validate } from 'uuid';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);
  private userService: UserService;

  constructor(@Inject() userService: UserService) {
    this.userService = userService;
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of all users with pagination and search' })
  @ApiQuery({ name: 'nameQuery', description: 'Name query for full-text search', required: false, type: String })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false, type: Number })
  @ApiQuery({ name: 'size', description: 'Number of items per page', required: false, type: Number })
  getAllUsers(@Query('nameQuery') nameQuery: string, @Query('page', ParseIntPipe) page: number, @Query('size', ParseIntPipe) size: number) {
    this.logger.log(`GET /user | Fetching users: nameQuery=${nameQuery}, page=${page}, size=${size}`);
    return this.userService.getAllUsers(nameQuery, page, size);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user profile by ID' })
  @ApiParam({ name: 'id', description: 'ID of the user', type: String })
  getUserById(@Param('id') id: string) {
    this.logger.log(`GET /user/${id} | Fetching user profile`);
    if (!validate(id)) {
      this.logger.warn(`GET /user/${id} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format. Must be a valid UUID.');
    }
    return this.userService.getUserById(id);
  }

  @Put(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user information by ID' })
  @ApiParam({ name: 'id', description: 'ID of the user to update', type: String })
  @ApiBody({ description: 'Updated user information', type: User })
  updateUser(@Param('id') id: string, @Body() user: User) {
    this.logger.log(`PUT /user/${id} | Updating user with data: ${JSON.stringify(user)}`);
    if (!validate(id)) {
      this.logger.warn(`GET /user/${id} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format. Must be a valid UUID.');
    }
    return this.userService.updateUser(id, user);
  }

  @Delete(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', description: 'ID of the user to delete', type: String })
  deleteUser(@Param('id') id: string) {
    this.logger.log(`DELETE /user/${id} | Deleting user`);
    if (!validate(id)) {
      this.logger.warn(`GET /user/${id} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format. Must be a valid UUID.');
    }
    return this.userService.deleteUser(id);
  }
}
