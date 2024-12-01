import { IsString, IsUUID } from 'class-validator';

export class Comment {
  @IsUUID()
  _id: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  targetId: string; //can be course or lesson

  @IsString()
  text: string;
}
