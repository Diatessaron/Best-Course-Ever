import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Survey } from '../model/survey';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);

  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
  ) {}

  async addSurvey(targetId: string, survey: Survey): Promise<Survey> {
    this.logger.log(`Adding survey for target ID: ${targetId}`);

    survey.targetId = targetId;

    try {
      const savedSurvey = await this.surveyRepository.save(survey);
      this.logger.log(`Survey added successfully with ID: ${savedSurvey._id}`);
      return savedSurvey;
    } catch (error) {
      this.logger.error(
        'Failed to insert survey into the database.',
        error.stack,
      );
      throw new BadRequestException('Failed to add survey.');
    }
  }
}
