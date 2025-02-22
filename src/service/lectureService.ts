import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Lecture } from '../model/lecture';
import { Course } from '../model/course';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

@Injectable()
export class LectureService {
  private readonly logger = new Logger(LectureService.name);

  constructor(
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async getLecturesByCourse(
    courseId: string,
    page: number = 1,
    size: number = 10,
  ): Promise<{
    lectures: Lecture[];
    total: number;
    page: number;
    size: number;
  }> {
    if (page < 1 || size < 1) {
      throw new BadRequestException('Page and size must be positive numbers.');
    }

    const course = await this.courseRepository.findOne({
      where: { _id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }

    const total = course.lectures.length;
    const lectures = await this.lectureRepository.find({
      where: {
        _id: In(course.lectures),
      },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      lectures,
      total,
      page,
      size,
    };
  }

  async getLectureById(courseId: string, lectureId: string): Promise<Lecture> {
    this.logger.log(
      `Fetching lecture by ID: courseId=${courseId}, lectureId=${lectureId}`,
    );

    const lecture = await this.lectureRepository.findOne({
      where: { _id: lectureId },
    });

    if (!lecture) {
      throw new NotFoundException(
        `Lecture with ID "${lectureId}" not found for course "${courseId}".`,
      );
    }

    return lecture;
  }

  async createLecture(courseId: string, lecture: Lecture): Promise<Lecture> {
    this.logger.log(
      `Creating a new lecture for course ID: ${courseId}, data: ${JSON.stringify(lecture)}`,
    );

    const course = await this.courseRepository.findOne({
      where: { _id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }

    const insertedLecture = await this.lectureRepository.save(lecture);
    this.courseRepository.merge(
      course,
      Object.assign(course, { lectures: [insertedLecture._id] }),
    );
    await this.lectureRepository.save(insertedLecture);

    this.logger.log(
      `Lecture created successfully with ID: ${insertedLecture._id}`,
    );
    return insertedLecture;
  }

  async updateLecture(
    courseId: string,
    lectureId: string,
    lectureDto: Partial<Lecture>,
  ): Promise<Lecture> {
    this.logger.log(
      `Updating lecture: courseId=${courseId}, lectureId=${lectureId}`,
    );

    const lecture = await this.getLectureById(courseId, lectureId);

    Object.assign(lecture, lectureDto);
    await this.lectureRepository.save(lecture);

    this.logger.log(`Lecture updated successfully: lectureId=${lecture._id}`);
    return lecture;
  }

  async deleteLecture(
    courseId: string,
    lectureId: string,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Deleting lecture: courseId=${courseId}, lectureId=${lectureId}`,
    );

    const result = await this.lectureRepository.delete({
      _id: lectureId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Lecture with ID "${lectureId}" not found for course "${courseId}".`,
      );
    }

    this.logger.log(`Lecture deleted successfully: lectureId=${lectureId}`);
    return { message: `Lecture with ID "${lectureId}" deleted successfully.` };
  }
}
