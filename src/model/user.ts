import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsEnum, IsString, IsUUID } from 'class-validator';

export enum UserRoles {
  USER = "USER",
  ADMIN = "ADMIN",
  AUTHOR = "AUTHOR"
}

export class User {
  @IsUUID()
  _id: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsArray()
  @IsEnum(UserRoles, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  roles: UserRoles[];

  @IsArray()
  @IsUUID('4', { each: true })
  courses: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  allowedCourses: string[];
}
