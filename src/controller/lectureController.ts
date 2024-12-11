import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { Lecture } from '../model/lecture';
import { AuthGuard } from '../guard/authGuard';
import { RolesGuard } from '../guard/rolesGuard';
import { Roles } from '../guard/roles';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Lecture')
@ApiBearerAuth()
@Controller('lecture')
@UseGuards(AuthGuard)
export class LectureController {
  @Get(':courseId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all lectures for a course with pagination' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false, type: Number })
  @ApiQuery({ name: 'size', description: 'Number of items per page', required: false, type: Number })
  getLecturesByCourse(@Param('courseId') courseId: string, @Query("page") page: number, @Query("size") size: number) {
    // todo: returns a list of lessons for a course with pagination
  }

  @Get(':courseId/:lectureId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get a lecture by ID for a specific course' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiParam({ name: 'lectureId', description: 'ID of the lecture', type: String })
  getLectureById(@Param('courseId') courseId: string, @Param('lectureId') lectureId: string) {
    // todo: returns a specific lesson with its details
  }

  @Post(':courseId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new lecture for a course' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiBody({ description: 'Details of the lecture to create', type: Lecture })
  createLecture(@Param('courseId') courseId: string, @Body() createLectureDto: Lecture) {
    // todo: adds a new lesson to a course
  }

  @Put(':courseId/:lectureId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update a lecture for a specific course by ID' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiParam({ name: 'lectureId', description: 'ID of the lecture to update', type: String })
  @ApiBody({ description: 'Updated lecture details', type: Lecture })
  updateLecture(@Param('courseId') courseId: string, @Param('lectureId') lectureId: string, @Body() updateLectureDto: Lecture) {
    // todo: updates a lesson's details
  }

  @Delete(':courseId/:lectureId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a lecture from a course by ID' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiParam({ name: 'lectureId', description: 'ID of the lecture to delete', type: String })
  deleteLecture(@Param('courseId') courseId: string, @Param('lectureId') lectureId: string) {
    // todo: deletes a lesson
  }
}
