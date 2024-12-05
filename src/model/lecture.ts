import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { File } from './file';

export class Lecture {
  @IsUUID()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => File)
  files: File[];
}
