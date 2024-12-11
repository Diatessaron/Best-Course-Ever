import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { Course } from '../model/course';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { RolesGuard } from '../guard/rolesGuard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Course')
@ApiBearerAuth()
@Controller('course')
@UseGuards(AuthGuard)
export class CourseController {
  @Get()
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all courses with pagination and search' })
  @ApiQuery({ name: 'query', description: 'Full-text search query', required: false, type: String })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false, type: Number })
  @ApiQuery({ name: 'size', description: 'Number of items per page', required: false, type: Number })
  getAllCourses(@Query('query') query: string, @Query("page") page: number, @Query("size") size: number) {
    // todo: returns a list of all courses with pagination and query for full-text search.
    //  Query can contain name, description, tags, difficultyLevel
  }

  @Get(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get a course by ID with its details and lessons' })
  @ApiParam({ name: 'id', description: 'ID of the course to retrieve', type: String })
  getCourseById(@Param('id') id: string) {
    // todo: returns a specific course with its details and lessons
  }

  @Post()
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ description: 'Details of the course to create', type: Course })
  createCourse(@Body() createCourseDto: Course) {
    // todo: creates a new course
  }

  @Put(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update course details by ID' })
  @ApiParam({ name: 'id', description: 'ID of the course to update', type: String })
  @ApiBody({ description: 'Updated course details', type: Course })
  updateCourse(@Param('id') id: string, @Body() updateCourseDto: Course) {
    // todo: updates a course's details
  }

  @Delete(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a course by ID' })
  @ApiParam({ name: 'id', description: 'ID of the course to delete', type: String })
  deleteCourse(@Param('id') id: string) {
    // Deletes a course
  }

  @Post(':id/allow')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Allow a user access to a course' })
  @ApiParam({ name: 'id', description: 'ID of the course', type: String })
  @ApiQuery({ name: 'userId', description: 'ID of the user to allow access', type: String })
  allowUserAccess(@Param('id') courseId: string, @Query('userId') userId: string) {
    // todo: adds a user to the list of allowed accounts for a course
  }
}
