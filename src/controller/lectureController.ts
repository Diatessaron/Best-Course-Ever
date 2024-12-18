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
import { Lecture } from '../model/lecture';
import { AuthGuard } from '../guard/authGuard';
import { RolesGuard } from '../guard/rolesGuard';
import { Roles } from '../guard/roles';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LectureService } from '../service/lectureService';
import { validate } from 'uuid';

@ApiTags('Lecture')
@ApiBearerAuth()
@Controller('lecture')
@UseGuards(AuthGuard)
export class LectureController {
  private readonly logger = new Logger(LectureController.name);
  private lectureService: LectureService;

  constructor(@Inject() lectureService: LectureService) {
    this.lectureService = lectureService;
  }

  @Get(':courseId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all lectures for a course with pagination' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false, type: Number })
  @ApiQuery({ name: 'size', description: 'Number of items per page', required: false, type: Number })
  getLecturesByCourse(@Param('courseId') courseId: string, @Query("page") page: number, @Query("size") size: number) {
    this.logger.log(`GET /lecture/${courseId} | Fetching lectures for course with pagination: page=${page}, size=${size}`);
    if (!validate(courseId)) {
      this.logger.warn(`GET /lecture/${courseId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format. Must be a valid UUID.');
    }
    return this.lectureService.getLecturesByCourse(courseId, page, size);
  }

  @Get(':courseId/:lectureId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get a lecture by ID for a specific course' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiParam({ name: 'lectureId', description: 'ID of the lecture', type: String })
  getLectureById(@Param('courseId') courseId: string, @Param('lectureId') lectureId: string) {
    this.logger.log(`GET /lecture/${courseId}/${lectureId} | Fetching lecture details`);
    if (!validate(courseId) || !validate(lectureId)) {
      this.logger.warn(`GET /lecture/${courseId}/${lectureId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format. Must be a valid UUID.');
    }
    return this.lectureService.getLectureById(courseId, lectureId);
  }

  @Post(':courseId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new lecture for a course' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiBody({ description: 'Details of the lecture to create', type: Lecture })
  createLecture(@Param('courseId') courseId: string, @Body() lecture: Lecture) {
    this.logger.log(`POST /lecture/${courseId} | Creating lecture`);
    if (!validate(courseId)) {
      this.logger.warn(`POST /lecture/${courseId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format. Must be a valid UUID.');
    }
    return this.lectureService.createLecture(courseId, lecture);
  }

  @Put(':courseId/:lectureId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update a lecture for a specific course by ID' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiParam({ name: 'lectureId', description: 'ID of the lecture to update', type: String })
  @ApiBody({ description: 'Updated lecture details', type: Lecture })
  updateLecture(@Param('courseId') courseId: string, @Param('lectureId') lectureId: string, @Body() updateLectureDto: Lecture) {
    this.logger.log(`PUT /lecture/${courseId}/${lectureId} | Updating lecture with data: ${JSON.stringify(updateLectureDto)}`);
    if (!validate(courseId) || !validate(lectureId)) {
      this.logger.warn(`POST /lecture/${courseId}/${lectureId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format. Must be a valid UUID.');
    }
    return this.lectureService.updateLecture(courseId, lectureId, updateLectureDto);
  }

  @Delete(':courseId/:lectureId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a lecture from a course by ID' })
  @ApiParam({ name: 'courseId', description: 'ID of the course', type: String })
  @ApiParam({ name: 'lectureId', description: 'ID of the lecture to delete', type: String })
  deleteLecture(@Param('courseId') courseId: string, @Param('lectureId') lectureId: string) {
    this.logger.log(`DELETE /lecture/${courseId}/${lectureId} | Deleting lecture`);
    if (!validate(courseId) || !validate(lectureId)) {
      this.logger.warn(`POST /lecture/${courseId}/${lectureId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format. Must be a valid UUID.');
    }
    return this.lectureService.deleteLecture(courseId, lectureId);
  }
}
