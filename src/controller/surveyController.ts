import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { Survey } from '../model/survey';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { RolesGuard } from '../guard/rolesGuard';

@Controller('survey')
@UseGuards(AuthGuard)
export class SurveyController {
  @Post(':targetId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  addSurvey(@Param('targetId') targetId: string, @Body() createSurveyDto: Survey) {
    // todo: dds a survey (difficultyRank and interestingRank) for a course, lesson, or user
  }
}
