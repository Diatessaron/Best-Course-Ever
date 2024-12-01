import { IsArray, IsString } from 'class-validator';

export class Lecture {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  files: string[];
}
