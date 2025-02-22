import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Course } from '../model/course';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../model/user';
import { Lecture } from '../model/lecture';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
  ) {}

  async getAllCourses(
    query: string = '',
    page: number = 1,
    size: number = 10,
  ): Promise<{ courses: Course[]; total: number; page: number; size: number }> {
    this.logger.log(
      `Fetching courses: query="${query}", page=${page}, size=${size}`,
    );

    const skip = (page - 1) * size;

    const formattedQuery = query
      .trim()
      .split(/\s+/)
      .map((word) => `${word}:*`)
      .join(' & ');

    const qb = this.courseRepository
      .createQueryBuilder('course')
      .where(`course.search_vector @@ to_tsquery(:query)`, {
        query: formattedQuery,
      })
      .skip(skip)
      .take(size);

    const [courses, total] = await qb.getManyAndCount();

    this.logger.log(
      `Fetched ${courses.length} courses out of ${total} total matching courses.`,
    );
    return { courses, total, page, size };
  }

  async getCourseById(courseId: string): Promise<Course> {
    this.logger.log(`Fetching course details with ID: ${courseId}`);

    const course = await this.courseRepository.findOne({
      where: { _id: courseId },
    });

    if (!course) {
      this.logger.warn(`Course not found: ID=${courseId}`);
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }

    if (course.lectures && course.lectures.length > 0) {
      const lectures = await this.lectureRepository.findBy({
        _id: In(course.lectures),
      });
      course.lectures = lectures as any;
    } else {
      course.lectures = [];
    }

    this.logger.log(`Course and lectures fetched successfully: ID=${courseId}`);
    return course;
  }

  async createCourse(course: Course): Promise<Course> {
    this.logger.log(
      `Creating a new course with data: ${JSON.stringify(course)}`,
    );

    const savedCourse = await this.courseRepository.save(course);

    this.logger.log(`Course created successfully with ID: ${savedCourse._id}`);
    return savedCourse;
  }

  async updateCourse(
    courseId: string,
    course: Partial<Course>,
  ): Promise<Course> {
    this.logger.log(
      `Updating course: ID=${courseId}, updateData=${JSON.stringify(course)}`,
    );

    const result = await this.courseRepository
      .createQueryBuilder()
      .update(Course)
      .set(course)
      .where('_id = :id', { id: courseId })
      .returning('*')
      .execute();

    if (!result.raw?.[0]) {
      this.logger.warn(`Course not found: ID=${courseId}`);
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }

    this.logger.log(`Course updated successfully: ID=${courseId}`);
    return result.raw[0];
  }

  async deleteCourse(courseId: string): Promise<{ message: string }> {
    this.logger.log(`Attempting to delete course with ID: ${courseId}`);

    const result = await this.courseRepository.delete(courseId);

    if (result.affected === 0) {
      this.logger.warn(`Course not found: ID=${courseId}`);
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }

    this.logger.log(`Course deleted successfully: ID=${courseId}`);
    return { message: `Course with ID "${courseId}" has been deleted.` };
  }

  async allowUserAccess(
    courseId: string,
    userId: string,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Allowing user with userId=${userId} to access a course with ID: ${courseId}`,
    );

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        allowedCourses: () =>
          `array_append(allowed_courses, '${courseId}'::uuid)`,
      })
      .where('_id = :userId', { userId })
      .execute()
      .catch((error) => {
        if (error.code === '23503') {
          throw new NotFoundException(
            `Either User with ID "${userId}" or Course with ID "${courseId}" not found.`,
          );
        }
        throw error;
      });

    this.logger.log(`Access granted for user ${userId} to course ${courseId}`);
    return {
      message: `User with ID "${userId}" has been granted an access to a course with ID: ${courseId} successfully.`,
    };
  }
}
