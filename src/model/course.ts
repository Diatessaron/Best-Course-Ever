import { IsArray, IsNumber, IsString, IsUUID } from 'class-validator';

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
  @IsUUID('4', { each: true })
  lectures: string[];
}
