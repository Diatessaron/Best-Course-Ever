import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum UserRoles {
  USER = "USER",
  ADMIN = "ADMIN",
  AUTHOR = "AUTHOR"
}

export class User {
  @IsUUID()
  _id: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRoles, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  roles: UserRoles[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  courses?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedCourses?: string[];
}
