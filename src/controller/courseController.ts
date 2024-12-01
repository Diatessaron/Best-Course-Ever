import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { Course } from '../model/course';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { RolesGuard } from '../guard/rolesGuard';

@Controller('course')
@UseGuards(AuthGuard)
export class CourseController {
  @Get()
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  getAllCourses(@Param('query') query: string, page: number, size: number) {
    // todo: returns a list of all courses with pagination and query for full-text search.
    //  Query can contain name, description, tags, difficultyLevel
  }

  @Get(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  getCourseById(@Param('id') id: string) {
    // todo: returns a specific course with its details and lessons
  }

  @Post()
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  createCourse(@Body() createCourseDto: Course) {
    // todo: creates a new course
  }

  @Put(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  updateCourse(@Param('id') id: string, @Body() updateCourseDto: Course) {
    // todo: updates a course's details
  }

  @Delete(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  deleteCourse(@Param('id') id: string) {
    // Deletes a course
  }

  @Post(':id/allow')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  allowUserAccess(@Param('id') courseId: string, @Body('userId') userId: string) {
    // todo: adds a user to the list of allowed accounts for a course
  }
}
