import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { Lecture } from '../model/lecture';
import { AuthGuard } from '../guard/authGuard';
import { RolesGuard } from '../guard/rolesGuard';
import { Roles } from '../guard/roles';

@Controller('lesson')
@UseGuards(AuthGuard)
export class LessonController {
  @Get(':courseId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  getLessonsByCourse(@Param('courseId') courseId: string) {
    // todo: returns a list of lessons for a course
  }

  @Get(':courseId/:lessonId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  getLessonById(@Param('courseId') courseId: string, @Param('lessonId') lessonId: string) {
    // todo: returns a specific lesson with its details
  }

  @Post(':courseId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  createLesson(@Param('courseId') courseId: string, @Body() createLessonDto: Lecture) {
    // todo: adds a new lesson to a course
  }

  @Put(':courseId/:lessonId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  updateLesson(@Param('courseId') courseId: string, @Param('lessonId') lessonId: string, @Body() updateLessonDto: Lecture) {
    // todo: updates a lesson's details
  }

  @Delete(':courseId/:lessonId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  deleteLesson(@Param('courseId') courseId: string, @Param('lessonId') lessonId: string) {
    // todo: deletes a lesson
  }
}
