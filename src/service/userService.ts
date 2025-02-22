import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../model/user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from '../common/decorator/transactionalDecorator';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Transactional()
  async getAllUsers(
    nameQuery: string,
    page: number = 1,
    size: number = 10,
  ): Promise<{ users: User[]; total: number; page: number; size: number }> {
    this.logger.log(
      `Fetching users: nameQuery=${nameQuery}, page=${page}, size=${size}`,
    );

    if (page < 1 || size < 1) {
      this.logger.warn(
        `Invalid pagination parameters: page=${page}, size=${size}`,
      );
      throw new BadRequestException('Page and size must be positive numbers');
    }

    const skip = (page - 1) * size;

    const queryBuilder = this.userRepository.createQueryBuilder('users');

    if (nameQuery) {
      queryBuilder.where(
        `to_tsvector('english', users.name) @@ plainto_tsquery(:nameQuery)`,
        { nameQuery },
      );
    }

    const [users, total] = await queryBuilder
      .select([
        'users._id',
        'users.name',
        'users.roles',
        'users.courses',
        'users.allowedCourses',
      ])
      .orderBy('users.name', 'ASC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return { users, total, page, size };
  }

  @Transactional()
  async getUserById(id: string): Promise<User> {
    this.logger.log(`Fetching user with ID: ${id}`);

    const user = await this.userRepository.findOne({
      where: { _id: id },
      select: ['_id', 'name', 'roles', 'courses', 'allowedCourses'],
    });

    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    return user;
  }

  @Transactional()
  async updateUser(id: string, userUpdates: Partial<User>): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);

    const existingUser = await this.userRepository.findOne({
      where: { _id: id },
    });

    if (!existingUser) {
      this.logger.warn(`User not found for update with ID: ${id}`);
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    delete userUpdates._id;
    delete userUpdates.password;

    const updatedUser = this.userRepository.merge(existingUser, userUpdates);
    await this.userRepository.save(updatedUser);

    return updatedUser;
  }

  @Transactional()
  async deleteUser(id: string): Promise<{ message: string }> {
    this.logger.log(`Attempting to delete user with ID: ${id}`);

    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      this.logger.warn(`User not found for ID: ${id}`);
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    this.logger.log(`User with ID: ${id} deleted successfully.`);
    return { message: `User with ID "${id}" has been deleted successfully.` };
  }
}
