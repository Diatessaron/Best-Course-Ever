import { IsString, IsUUID } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  _id: string;

  @Column('uuid')
  @IsUUID()
  userId: string;

  @Column('uuid')
  @IsUUID()
  targetId: string; //can be course or lesson

  @Column('text')
  @IsString()
  text: string;
}
