import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { File } from '../model/file';
import { v4 } from 'uuid';
import { Lecture } from '../model/lecture';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from '../common/decorator/transactionalDecorator';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
  ) {}

  @Transactional()
  async saveFile(
    lectureId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const fileDocument: File = {
      _id: v4(),
      name: file.originalname,
      description: '',
      uploadDate: new Date(),
      data: file.buffer,
    };

    const result = await this.lectureRepository
      .createQueryBuilder()
      .update(Lecture)
      .set({
        files: () =>
          `COALESCE(files, '[]'::jsonb) || '${JSON.stringify([fileDocument])}'::jsonb`,
      })
      .where('_id = :lectureId', { lectureId })
      .returning(['_id'])
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`Lecture with ID "${lectureId}" not found`);
    }

    this.logger.log(`File saved successfully for lecture ${lectureId}`);
    return 'File saved successfully.';
  }
}
