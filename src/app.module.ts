import { Module } from '@nestjs/common';
import { SurveyController } from './controller/surveyController';
import { AuthController } from './controller/authController';
import { UserController } from './controller/userController';
import { LectureController } from './controller/lectureController';
import { CourseController } from './controller/courseController';
import { CommentController } from './controller/commentController';
import { AuthGuard } from './guard/authGuard';
import { RolesGuard } from './guard/rolesGuard';

@Module({
  imports: [],
  controllers: [
    CommentController,
    CourseController,
    LectureController,
    UserController,
    AuthController,
    SurveyController
  ],
  providers: [
    // CommentService,
    // UserService,
    // CourseService,
    // AuthService,
    // UserService,
    // LessonService,
    // SurveyService,
    // FileService
    RolesGuard,
    AuthGuard
  ],
})
export class AppModule {}
