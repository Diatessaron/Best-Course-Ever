import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { Lecture } from '../model/lecture';
import { AuthGuard } from '../guard/authGuard';
import { RolesGuard } from '../guard/rolesGuard';
import { Roles } from '../guard/roles';

@Controller('Lecture')
@UseGuards(AuthGuard)
export class LectureController {
  @Get(':courseId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  getLecturesByCourse(@Param('courseId') courseId: string) {
    // todo: returns a list of lessons for a course
  }

  @Get(':courseId/:lectureId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  getLectureById(@Param('courseId') courseId: string, @Param('lectureId') lectureId: string) {
    // todo: returns a specific lesson with its details
  }

  @Post(':courseId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  createLecture(@Param('courseId') courseId: string, @Body() createLectureDto: Lecture) {
    // todo: adds a new lesson to a course
  }

  @Put(':courseId/:lectureId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  updateLecture(@Param('courseId') courseId: string, @Param('lectureId') lectureId: string, @Body() updateLectureDto: Lecture) {
    // todo: updates a lesson's details
  }

  @Delete(':courseId/:lectureId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  deleteLecture(@Param('courseId') courseId: string, @Param('lectureId') lectureId: string) {
    // todo: deletes a lesson
  }
}
