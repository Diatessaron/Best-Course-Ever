import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import { User } from '../model/user';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { promisify } from 'util';
import { pbkdf2, randomBytes } from 'crypto';

const randomBytesAsync = promisify(randomBytes);
const pbkdf2Async = promisify(pbkdf2)

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly userCollection: Collection<User>;
  private readonly jwtService: JwtService;
  private readonly blacklistCollection: Collection;

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Db,
    jwtService: JwtService,
  ) {
    this.userCollection = db.collection('users');
    this.blacklistCollection = db.collection('blacklistedTokens');
    this.jwtService = jwtService;
  }

  async login(email: string, password: string): Promise<{ message: string }> {
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Credentials are not correct');
    }
    if (!password) {
      throw new BadRequestException('Credentials are not correct');
    }

    const user = await this.userCollection.findOne({ email: email }, {
      projection: {
        salt: 1,
        _id: 1,
        email: 1,
        password: 1,
        roles: 1,
      },
    }) as User & { salt?: string } | null;
    if (!user || !user.salt) {
      throw new BadRequestException('Credentials are not correct');
    }
    if ((await this.hashPassword(password, user.salt)) !== user.password) {
      throw new BadRequestException('Credentials are not correct');
    }

    const payload = { _id: user._id, email: user.email, roles: user.roles };
    return { message: this.jwtService.sign(payload, { expiresIn: '7d' }) };
  }

  async logout(token: string) {
    const decoded = this.jwtService.decode(token);

    if (decoded && decoded.exp) {
      const expiry = new Date(decoded.exp * 1000);
      const currentTime = new Date();

      if (expiry > currentTime) {
        await this.blacklistCollection.insertOne({
          token: token,
          expiresAt: expiry,
        });
      }
    }
  }

  async signup(user: User): Promise<{ message: string }> {
    const existingUser = await this.userCollection.findOne({ email: user.email });
    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }
    if (!user.email || !user.password || !user.roles || user.roles.length === 0) {
      throw new BadRequestException('Missing required fields');
    }
    if (!this.isStrongPassword(user.password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      );
    }
    if (!this.isValidEmail(user.email)) {
      throw new BadRequestException('Invalid email address');
    }

    const salt = await randomBytesAsync(16).then(rs => rs.toString('hex'));
    const hashedPassword = await this.hashPassword(user.password, salt);

    const newUser = {
      ...user,
      _id: v4(),
      password: hashedPassword,
      roles: user.roles,
      salt: salt
    };

    await this.userCollection.insertOne(newUser);

    // Generate JWT token
    const payload = {
      _id: newUser._id,
      email: newUser.email,
      roles: newUser.roles,
    };
    return { message: this.jwtService.sign(payload, { expiresIn: '7d' }) };
  }

  private validateJwtToken(token: string): any {
    return this.jwtService.verify(token);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isStrongPassword(password: string): boolean {
    // Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return pbkdf2Async(password, salt, 1000, 64, 'sha512').then(rs => rs.toString('hex'));
  }
}
