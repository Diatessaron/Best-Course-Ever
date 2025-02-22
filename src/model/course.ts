import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  _id: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Column({ nullable: true, type: 'text' })
  @IsOptional()
  @IsString()
  description?: string;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Column({ nullable: true, type: 'int', name: 'difficulty_level' })
  @IsOptional()
  @IsNumber()
  difficultyLevel?: number;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  lectures?: string[];
}
