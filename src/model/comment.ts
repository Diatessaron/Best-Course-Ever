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

  constructor(id: string, userId: string, targetId: string, text: string) {
    this._id = id;
    this.userId = userId;
    this.targetId = targetId;
    this.text = text;
  }
}
