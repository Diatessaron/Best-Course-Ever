import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum SurveyType {
  DIFFICULT = 'DIFFICULT',
  INTERESTING = 'INTERESTING',
}

@Entity('surveys')
export abstract class Survey {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  _id: string;

  @Column({
    type: 'enum',
    enum: SurveyType,
    nullable: true,
  })
  @IsOptional()
  @IsIn(Object.values(SurveyType))
  type?: SurveyType;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'target_id' })
  @IsOptional()
  @IsUUID()
  targetId?: string; // UUID of course, lecture, or user

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rank?: number;
}
