import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Collection, Db, DeleteResult, InsertOneResult, UpdateResult } from 'mongodb';
import { Course } from '../model/course';
import { Lecture } from '../model/lecture';
import { User } from '../model/user';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);
  private courseCollection: Collection<Course>;
  private lectureCollection: Collection<Lecture>;
  private userCollection: Collection<User>;

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Db,
  ) {
    this.courseCollection = db.collection('courses');
    this.lectureCollection = db.collection('lectures');
    this.userCollection = db.collection('users');
  }

  async getAllCourses(
    query: string = '',
    page: number = 1,
    size: number = 10,
  ): Promise<{ courses: Course[]; total: number; page: number; size: number }> {
    this.logger.log(`Fetching courses: query="${query}", page=${page}, size=${size}`);

    const skip = (page - 1) * size;

    const searchQuery: any = {};
    if (query) {
      searchQuery.$text = query;
      this.logger.log(`Performing full-text search with query: "${query}"`);
    }

    const [courses, total] = await Promise.all([
      this.courseCollection.find(searchQuery).sort({ score: { $meta: 'textScore' } }).skip(skip).limit(size).toArray(),
      this.courseCollection.countDocuments(searchQuery),
    ]);

    this.logger.log(`Fetched ${courses.length} courses out of ${total} total matching courses.`);
    return { courses, total, page, size };
  }

  async getCourseById(courseId: string): Promise<{ course: Course; lessons: Lecture[] }> {
    this.logger.log(`Fetching course details with ID: ${courseId}`);

    const course = await this.courseCollection.findOne({ _id: courseId });
    if (!course) {
      this.logger.warn(`Course not found: ID=${courseId}`);
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }
    const lessons = await this.lectureCollection.find({ courseId }).toArray();

    this.courseCollection.aggregate(
      [
        { $match: { _id: courseId } },
        { $lookup: { from: 'lectures', localField: 'lectures', foreignField: '_id', as: 'tempLectures' } },
        { $project: { name: 1, description: 1, tags: 1, difficultyLevel: 1, lectures: '$tempLectures' } },
      ],
    );

    this.logger.log(`Course and lessons fetched successfully: ID=${courseId}`);
    return { course, lessons };
  }

  async createCourse(course: Course): Promise<Course> {
    this.logger.log(`Creating a new course with data: ${JSON.stringify(course)}`);

    const result: InsertOneResult<Course> = await this.courseCollection.insertOne(course);

    if (!result.acknowledged) {
      this.logger.error('Failed to insert the new course into the database.');
      throw new BadRequestException('Failed to create the course.');
    }

    this.logger.log(`Course created successfully with ID: ${result.insertedId}`);
    return course;
  }

  async updateCourse(courseId: string, course: Partial<Course>): Promise<Course> {
    this.logger.log(
      `Updating course: ID=${courseId}, updateData=${JSON.stringify(course)}`,
    );

    const result: UpdateResult = await this.courseCollection.updateOne(
      { _id: courseId },
      { $set: course },
    );

    if (result.matchedCount === 0) {
      this.logger.warn(`Course not found: ID=${courseId}`);
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }

    const updatedCourse = await this.courseCollection.findOne({ _id: courseId });
    this.logger.log(`Course updated successfully: ID=${courseId}`);
    return updatedCourse;
  }

  async deleteCourse(courseId: string): Promise<{ message: string }> {
    this.logger.log(`Attempting to delete course with ID: ${courseId}`);

    const result: DeleteResult = await this.courseCollection.deleteOne({ _id: courseId });

    if (result.deletedCount === 0) {
      this.logger.warn(`Course not found: ID=${courseId}`);
      throw new NotFoundException(`Course with ID "${courseId}" not found.`);
    }

    this.logger.log(`Course deleted successfully: ID=${courseId}`);
    return { message: `Course with ID "${courseId}" has been deleted successfully.` };
  }

  async allowUserAccess(courseId: string, userId: string): Promise<{ message: string }> {
    this.logger.log(`Allowing user with userId=${userId} to access a course with ID: ${courseId}`);

    const updateResult = await this.userCollection.updateOne({ _id: userId }, { $push: { allowedCourses: courseId } });

    if (updateResult.modifiedCount === 0) {
      this.logger.error(`User with ID: ${userId} not found`)
      throw new NotFoundException(`User with ID "${userId}" not found. Allowed courses are not updated.`);
    }

    this.logger.log(`Attempting to delete course with ID: ${courseId}`);
    return { message: `User with ID "${userId}" has been granted an access to a course with ID: ${courseId} successfully.` };
  }
}
