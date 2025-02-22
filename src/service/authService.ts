import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { User } from '../model/user';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { promisify } from 'util';
import { pbkdf2, randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistedToken } from '../model/blacklistedToken';
import { Transactional } from '../common/decorator/transactionalDecorator';

const randomBytesAsync = promisify(randomBytes);
const pbkdf2Async = promisify(pbkdf2);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BlacklistedToken)
    private readonly blacklistRepository: Repository<BlacklistedToken>,
    private readonly jwtService: JwtService,
  ) {}

  @Transactional()
  async login(email: string, password: string): Promise<{ message: string }> {
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Credentials are not correct');
    }
    if (!password) {
      throw new BadRequestException('Credentials are not correct');
    }

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['_id', 'email', 'password', 'roles', 'salt'],
    });

    if (!user || !user.salt) {
      throw new BadRequestException('Credentials are not correct');
    }

    if ((await this.hashPassword(password, user.salt)) !== user.password) {
      throw new BadRequestException('Credentials are not correct');
    }

    const payload = { id: user._id, email: user.email, roles: user.roles };
    return { message: this.jwtService.sign(payload, { expiresIn: '7d' }) };
  }

  @Transactional()
  async logout(token: string) {
    const decoded = this.jwtService.decode(token);

    if (decoded && decoded.exp) {
      const expiry = new Date(decoded.exp * 1000);
      const currentTime = new Date();

      if (expiry > currentTime) {
        const blacklistedToken = this.blacklistRepository.create({
          token: token,
          expiresAt: expiry,
        });
        await this.blacklistRepository.save(blacklistedToken);
      }
    }
  }

  @Transactional()
  async signup(userData: Partial<User>): Promise<{ message: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    if (
      !userData.email ||
      !userData.password ||
      !userData.roles ||
      userData.roles.length === 0
    ) {
      throw new BadRequestException('Missing required fields');
    }

    if (!this.isStrongPassword(userData.password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      );
    }

    if (!this.isValidEmail(userData.email)) {
      throw new BadRequestException('Invalid email address');
    }

    const salt = await randomBytesAsync(16).then((rs) => rs.toString('hex'));
    const hashedPassword = await this.hashPassword(userData.password, salt);

    const user = this.userRepository.create({
      ...userData,
      _id: v4(),
      password: hashedPassword,
      salt: salt,
    });

    await this.userRepository.save(user);

    // Generate JWT token
    const payload = {
      id: user._id,
      email: user.email,
      roles: user.roles,
    };
    return { message: this.jwtService.sign(payload, { expiresIn: '7d' }) };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isStrongPassword(password: string): boolean {
    // Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return pbkdf2Async(password, salt, 1000, 64, 'sha512').then((rs) =>
      rs.toString('hex'),
    );
  }
}
