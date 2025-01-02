import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class Course {
  @IsUUID()
  _id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  difficultyLevel?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  lectures?: string[];
}
