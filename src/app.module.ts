import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './controller/surveyController';
import { AuthController } from './controller/authController';
import { UserController } from './controller/userController';
import { LectureController } from './controller/lectureController';
import { CourseController } from './controller/courseController';
import { CommentController } from './controller/commentController';
import { AuthGuard } from './common/guard/authGuard';
import { RolesGuard } from './common/guard/rolesGuard';
import { CommentService } from './service/commentService';
import { UserService } from './service/userService';
import { CourseService } from './service/courseService';
import { AuthService } from './service/authService';
import { SurveyService } from './service/surveyService';
import { FileService } from './service/fileService';
import { LectureService } from './service/lectureService';
import { MigrationService } from './db/migrationService';
import { FileController } from './controller/fileController';
import { JwtModule } from '@nestjs/jwt';
import { UserContextService } from './service/userContextService';
import { AppDataSource } from './db/data-source';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => ({
        ...AppDataSource.options,
      }),
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    CommentController,
    CourseController,
    LectureController,
    UserController,
    AuthController,
    SurveyController,
    FileController,
  ],
  providers: [
    UserContextService,
    CommentService,
    CourseService,
    AuthService,
    UserService,
    LectureService,
    SurveyService,
    FileService,
    MigrationService,
    RolesGuard,
    AuthGuard,
  ],
})
export class AppModule {}
