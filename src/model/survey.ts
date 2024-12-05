import { IsIn, IsInt, IsUUID, Max, Min } from 'class-validator';

export enum SurveyType {
  DIFFICULT = "DIFFICULT",
  INTERESTING = "INTERESTING"
}

export abstract class Survey {
  @IsUUID()
  _id: string;

  @IsIn(Object.values(SurveyType))
  type: SurveyType

  @IsUUID()
  userId: string;

  @IsUUID()
  targetId: string; // UUID of course, lecture, or user

  @IsInt()
  @Min(1)
  @Max(5)
  rank: number;
}

export class DifficultySurvey extends Survey {
  type: SurveyType = SurveyType.DIFFICULT;
}

export class InterestingSurvey extends Survey {
  type: SurveyType = SurveyType.INTERESTING;
}
