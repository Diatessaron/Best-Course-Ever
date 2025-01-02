import { Controller, Post, Param, Body, UseGuards, Logger, Inject, BadRequestException } from '@nestjs/common';
import { Survey } from '../model/survey';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { RolesGuard } from '../guard/rolesGuard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SurveyService } from '../service/surveyService';
import { validate } from 'uuid';

@ApiTags('Survey')
@ApiBearerAuth()
@Controller('survey')
@UseGuards(AuthGuard)
export class SurveyController {
  private readonly logger = new Logger(SurveyController.name);
  private surveyService: SurveyService;

  constructor(@Inject() surveyService: SurveyService) {
    this.surveyService = surveyService
  }

  @Post(':targetId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add a survey for a course, lesson, or user' })
  @ApiParam({ name: 'targetId', description: 'ID of the target (course, lesson, or user)', type: String })
  @ApiBody({
    description: 'Details of the survey to be added, including difficultyRank and interestingRank',
    type: Survey,
  })
  addSurvey(@Param('targetId') targetId: string, @Body() survey: Survey) {
    this.logger.log(`POST /survey/${targetId} | Adding survey`);
    if (!validate(targetId)) {
      this.logger.warn(`GET /survey/${targetId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format. Must be a valid UUID.');
    }
    return this.surveyService.addSurvey(targetId, survey);
  }
}
