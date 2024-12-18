import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Logger,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { Course } from '../model/course';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { RolesGuard } from '../guard/rolesGuard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CourseService } from '../service/courseService';
import { validate } from 'uuid';

@ApiTags('Course')
@ApiBearerAuth()
@Controller('course')
@UseGuards(AuthGuard)
export class CourseController {
  private readonly logger = new Logger(CourseController.name);
  private courseService: CourseService;

  constructor(@Inject() courseService: CourseService) {
    this.courseService = courseService;
  }

  @Get()
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all courses with pagination and search' })
  @ApiQuery({ name: 'query', description: 'Full-text search query', required: false, type: String })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false, type: Number })
  @ApiQuery({ name: 'size', description: 'Number of items per page', required: false, type: Number })
  getAllCourses(@Query('query') query: string, @Query("page") page: number, @Query("size") size: number) {
    this.logger.log(`GET /course | Fetching courses with query="${query}", page=${page}, size=${size}`);
    return this.courseService.getAllCourses(query, page, size);
  }

  @Get(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get a course by ID with its details and lessons' })
  @ApiParam({ name: 'id', description: 'ID of the course to retrieve', type: String })
  getCourseById(@Param('id') id: string) {
    this.logger.log(`GET /course/${id} | Fetching course details with lessons`);
    if (!validate(id)) {
      this.logger.warn(`GET /course/${id} | Invalid ID format`);
      throw new BadRequestException(`GET /course/${id} | Invalid ID format`);
    }
    return this.courseService.getCourseById(id);
  }

  @Post()
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ description: 'Details of the course to create', type: Course })
  createCourse(@Body() course: Course) {
    this.logger.log(`POST /course | Creating a course`);
    return this.courseService.createCourse(course);
  }

  @Put(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update course details by ID' })
  @ApiParam({ name: 'id', description: 'ID of the course to update', type: String })
  @ApiBody({ description: 'Updated course details', type: Course })
  updateCourse(@Param('id') id: string, @Body() course: Course) {
    this.logger.log(`PUT /course/${id} | Updating course with data: ${JSON.stringify(course)}`);
    if (!validate(id)) {
      this.logger.warn(`PUT /course/${id} | Invalid ID format`);
      throw new BadRequestException(`PUT /course/${id} | Invalid ID format`);
    }
    return this.courseService.updateCourse(id, course);
  }

  @Delete(':id')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a course by ID' })
  @ApiParam({ name: 'id', description: 'ID of the course to delete', type: String })
  deleteCourse(@Param('id') id: string) {
    this.logger.log(`DELETE /course/${id} | Deleting course`);
    if (!validate(id)) {
      this.logger.warn(`DELETE /course/${id} | Invalid ID format`);
      throw new BadRequestException(`DELETE /course/${id} | Invalid ID format`);
    }
    return this.courseService.deleteCourse(id);
  }

  @Post(':id/allow')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Allow a user access to a course' })
  @ApiParam({ name: 'id', description: 'ID of the course', type: String })
  @ApiQuery({ name: 'userId', description: 'ID of the user to allow access', type: String })
  allowUserAccess(@Param('id') courseId: string, @Query('userId') userId: string) {
    this.logger.log(`DELETE /course/${courseId}?userId=${userId} | Allow user access`);
    if (!validate(courseId) || !validate(userId)) {
      this.logger.warn(`DELETE /course/${courseId}?userId=${userId} | Invalid ID format`);
      throw new BadRequestException(`DELETE /course/${courseId}?userId=${userId} | Invalid ID format`);
    }
    return this.courseService.allowUserAccess(courseId, userId)
  }
}
