import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';

@Injectable()
export class AuthService {

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Db
  ) {

  }


}
