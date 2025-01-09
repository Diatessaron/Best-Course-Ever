import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Collection, Db, DeleteResult, UpdateResult } from 'mongodb';
import { Lecture } from '../model/lecture';
import { Course } from '../model/course';

@Injectable()
export class LectureService {
  private readonly logger = new Logger(LectureService.name);
  private lectureCollection: Collection<Lecture>;
  private courseCollection: Collection<Course>;

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Db,
  ) {
    this.lectureCollection = db.collection('lectures');
    this.courseCollection = db.collection('courses');
  }

  async getLecturesByCourse(courseId: string, page: number = 1, size: number = 10): Promise<{
    lectures: Lecture[],
    total: number,
    page: number,
    size: number
  }> {
    if (page < 1 || size < 1) {
      throw new BadRequestException('Page and size must be positive numbers.');
    }

    const course = await this.courseCollection.findOne({ _id: courseId });
    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }

    const lectureIds = course.lectures;
    if (!lectureIds || lectureIds.length === 0) {
      return { lectures: [], total: 0, page: page, size: size };
    }

    const start = (page - 1) * size;
    const end = start + size;

    const paginatedLectureIds = lectureIds.slice(start, end);

    const lectures = await this.lectureCollection.find({
      _id: { $in: paginatedLectureIds },
    }).toArray();

    this.logger.log(`Lectures fetched successfully: courseId=${courseId}`);
    return {
      lectures,
      total: lectureIds.length,
      page,
      size,
    };
  }

  async getLectureById(courseId: string, lectureId: string): Promise<Lecture> {
    this.logger.log(`Fetching lecture by ID: courseId=${courseId}, lectureId=${lectureId}`);

    const lecture = await this.lectureCollection.findOne({ _id: lectureId });

    if (!lecture) {
      this.logger.warn(`Lecture not found: courseId=${courseId}, lectureId=${lectureId}`);
      throw new NotFoundException(`Lecture with ID "${lectureId}" not found for course "${courseId}".`);
    }

    this.logger.log(`Lecture fetched successfully: lectureId=${lectureId}`);
    return lecture;
  }

  async createLecture(courseId: string, lecture: Lecture): Promise<Lecture> {
    this.logger.log(`Creating a new lecture for course ID: ${courseId}, data: ${JSON.stringify(lecture)}`);

    const [updateResult, insertResult] = await Promise.all([
      this.courseCollection.updateOne({ _id: courseId }, { $push: { lectures: lecture._id } }),
      this.lectureCollection.insertOne(lecture),
    ]);

    if (updateResult.modifiedCount === 0 || !insertResult.acknowledged) {
      this.logger.error('Failed to insert the new lecture into the database.');
      throw new BadRequestException('Failed to create the lecture.');
    }

    this.logger.log(`Lecture created successfully with ID: ${lecture._id}`);
    return lecture;
  }

  async updateLecture(courseId: string, lectureId: string, lecture: Partial<Lecture>): Promise<Lecture> {
    this.logger.log(`Updating lecture: courseId=${courseId}, lectureId=${lectureId}`);

    const result: UpdateResult = await this.lectureCollection.updateOne(
      { _id: lectureId },
      { $set: lecture },
    );

    if (result.matchedCount === 0) {
      this.logger.warn(`Lecture not found for update: courseId=${courseId}, lectureId=${lectureId}`);
      throw new NotFoundException(`Lecture with ID "${lectureId}" not found for course "${courseId}".`);
    }

    const updatedLecture = await this.lectureCollection.findOne({ _id: lectureId });

    this.logger.log(`Lecture updated successfully: lectureId=${lectureId}`);
    return updatedLecture;
  }

  async deleteLecture(courseId: string, lectureId: string): Promise<{ message: string }> {
    this.logger.log(`Deleting lecture: courseId=${courseId}, lectureId=${lectureId}`);

    const result: DeleteResult = await this.lectureCollection.deleteOne({ _id: lectureId });

    if (result.deletedCount === 0) {
      this.logger.warn(`Lecture not found for deletion: courseId=${courseId}, lectureId=${lectureId}`);
      throw new NotFoundException(`Lecture with ID "${lectureId}" not found for course "${courseId}".`);
    }

    this.logger.log(`Lecture deleted successfully: lectureId=${lectureId}`);
    return { message: `Lecture with ID "${lectureId}" has been deleted successfully.` };
  }
}
