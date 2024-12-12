import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { Survey } from '../model/survey';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { RolesGuard } from '../guard/rolesGuard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Survey')
@ApiBearerAuth()
@Controller('survey')
@UseGuards(AuthGuard)
export class SurveyController {
  @Post(':targetId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add a survey for a course, lesson, or user' })
  @ApiParam({ name: 'targetId', description: 'ID of the target (course, lesson, or user)', type: String })
  @ApiBody({
    description: 'Details of the survey to be added, including difficultyRank and interestingRank',
    type: Survey,
  })
  addSurvey(@Param('targetId') targetId: string, @Body() createSurveyDto: Survey) {
    // todo: adds a survey (difficultyRank and interestingRank) for a course, lesson, or user
  }
}
