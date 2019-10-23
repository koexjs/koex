import { Context, User } from '@koex/core';

export interface IStrategy {
  user(id: User['id']): Promise<User>;
  authenticate(ctx: Context): Promise<void>;
  callback(ctx: Context): Promise<User['id']>;
}
