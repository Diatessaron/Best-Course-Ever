import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Collection, Db, DeleteResult } from 'mongodb';
import { User } from '../model/user';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private userCollection: Collection<User>;

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Db
  ) {
    this.userCollection = db.collection('users')
  }

  async getAllUsers(nameQuery: string, page: number = 1, size: number = 10): Promise<{ users: User[]; total: number; page: number; size: number }> {
    this.logger.log(`Fetching users: nameQuery=${nameQuery}, page=${page}, size=${size}`);

    if (page < 1 || size < 1) {
      this.logger.warn(`Invalid pagination parameters: page=${page}, size=${size}`);
      throw new BadRequestException('Page and size must be positive numbers');
    }

    const query: any = {};
    if (nameQuery) {
      query.$text = { $search: nameQuery };
    }
    const skip = (page - 1) * size;

    const [users, total] = await Promise.all([
      this.userCollection.find(query, { projection: { email: 0, password: 0 } })
        .sort({ score: { $meta: 'textScore' } }).skip(skip).limit(size).toArray(),
      this.userCollection.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      size,
    };
  }

  async getUserById(id: string): Promise<User> {
    this.logger.log(`Fetching user with ID: ${id}`);

    const user = await this.userCollection.findOne({ _id: id }, { projection: { email: 0, password: 0 } });

    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    return user;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);

    //cannot override
    user._id = id;
    user.password = undefined

    const result = await this.userCollection.updateOne(
      { _id: id },
      { $set: user }
    );

    if (result.matchedCount === 0) {
      this.logger.warn(`User not found for update with ID: ${id}`);
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    return await this.userCollection.findOne({ _id: id });
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    this.logger.log(`Attempting to delete user with ID: ${id}`);

    const result: DeleteResult = await this.userCollection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      this.logger.warn(`User not found for ID: ${id}`);
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    this.logger.log(`User with ID: ${id} deleted successfully.`);
    return { message: `User with ID "${id}" has been deleted successfully.` };
  }
}
