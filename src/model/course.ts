import { Lecture } from './lecture';
import { IsArray, IsNumber, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class Course {
  @IsUUID()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsNumber()
  difficultyLevel: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Lecture)
  lectures: Lecture[];
}
