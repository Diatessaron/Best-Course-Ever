import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Collection, Db, InsertOneResult } from 'mongodb';
import { Survey } from '../model/survey';

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);
  private surveyCollection: Collection<Survey>

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Db
  ) {
    this.surveyCollection = db.collection('surveys')
  }

  async addSurvey(targetId: string, survey: Survey): Promise<Survey> {
    this.logger.log(`Adding survey for target ID: ${targetId}`);

      const result: InsertOneResult<Survey> = await this.surveyCollection.insertOne(survey);

      if (!result.acknowledged) {
        this.logger.error('Failed to insert survey into the database.');
        throw new BadRequestException('Failed to add survey.');
      }

      this.logger.log(`Survey added successfully with ID: ${result.insertedId}`);
      return survey;
  }
}
