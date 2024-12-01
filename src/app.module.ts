import { Module } from '@nestjs/common';
import { SurveyController } from './controller/surveyController';
import { AuthController } from './controller/authController';
import { UserController } from './controller/userController';
import { LessonController } from './controller/lessonController';
import { CourseController } from './controller/courseController';
import { CommentController } from './controller/commentController';
import { AuthGuard } from './guard/authGuard';
import { RolesGuard } from './guard/rolesGuard';

@Module({
  imports: [],
  controllers: [
    CommentController,
    CourseController,
    LessonController,
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
    // SurveyService
    RolesGuard,
    AuthGuard
  ],
})
export class AppModule {}
