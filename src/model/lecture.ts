import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { File } from './file';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('lectures')
export class Lecture {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  _id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => File)
  files?: File[];
}
