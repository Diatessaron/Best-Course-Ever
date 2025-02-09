import { Injectable, Scope } from '@nestjs/common';
import { User } from '../model/user';

@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
  private userToken: string;
  private user: User;

  setUserToken(token: string) {
    this.userToken = token;
  }

  getUserToken(): string {
    return this.userToken;
  }

  setUser(user: User) {
    this.user = user;
  }

  getUser(): User {
    return this.user;
  }
}
