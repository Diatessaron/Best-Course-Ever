import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRoles {
  USER = 'USER',
  ADMIN = 'ADMIN',
  AUTHOR = 'AUTHOR',
}

//User model in DB has 'salt' param, and it's omitted here for security reasons
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  _id: string;

  @Column({ nullable: false, unique: true })
  @IsOptional()
  @IsEmail()
  email: string;

  @Column({ nullable: false })
  @IsOptional()
  @IsString()
  password: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  name: string;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRoles, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  roles: UserRoles[];

  @Column('uuid', { array: true, nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  courses?: string[];

  @Column('uuid', { array: true, nullable: true, name: 'allowed_courses' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedCourses?: string[];

  @Column({ nullable: true })
  @IsOptional()
  salt?: string;
}
