import { Inject, Injectable, Logger } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import { File } from '../model/file';
import { v4 } from 'uuid';
import { Lecture } from '../model/lecture';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name)
  private lectureCollection: Collection<Lecture>;

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Db
  ) {
    this.lectureCollection = db.collection('lectures');
  }

  async saveFile(lectureId: string, file: Express.Multer.File): Promise<string> {
    const fileDocument: File = {
      _id: v4(),
      name: file.originalname,
      description: '',
      uploadDate: new Date(),
      data: file.buffer,
    };

    await this.lectureCollection.updateOne( { _id: lectureId }, { $push: { files: fileDocument } } );

    this.logger.log("File saved successfully");
    return "File saved successfully.";
  }
}
