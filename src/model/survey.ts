import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export enum SurveyType {
  DIFFICULT = "DIFFICULT",
  INTERESTING = "INTERESTING"
}

export abstract class Survey {
  @IsUUID()
  _id: string;

  @IsOptional()
  @IsIn(Object.values(SurveyType))
  type?: SurveyType

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  targetId?: string; // UUID of course, lecture, or user

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rank?: number;
}

export class DifficultySurvey extends Survey {
  type: SurveyType = SurveyType.DIFFICULT;
}

export class InterestingSurvey extends Survey {
  type: SurveyType = SurveyType.INTERESTING;
}
