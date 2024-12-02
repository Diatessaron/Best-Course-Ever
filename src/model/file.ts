import { IsDate, IsString, IsUUID } from 'class-validator';

export class File {
  @IsUUID()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsDate()
  uploadDate: Date;

  @IsString()
  link: string;
}
