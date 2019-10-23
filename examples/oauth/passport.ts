import Koex, { Context } from '@koex/core';
import passport, { Strategy } from '@koex/passport';

import * as qs from '@zcorky/query-string';
import fetch from 'node-fetch';

export interface GithubStrategyOptions {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export class GithubStrategy extends Strategy {
  constructor(private readonly options: GithubStrategyOptions) {
    super();
  }

  public async user(id: string) {
    return {
      id,
    };
  }

  public async authenticate(ctx: Context) {
    const { client_id, redirect_uri } = this.options;
    const scope = '';
    const response_type = 'code';
    const payload = {
      client_id,
      redirect_uri,
      response_type,
      scope,
    };

    const authorize_url = `https://github.com/login/oauth/authorize?${qs.stringify(payload)}`;

    ctx.redirect(authorize_url);
  }

  public async callback(ctx: Context) {
    const code = ctx.query.code;
    const { client_id, client_secret, redirect_uri } = this.options;
    const scope = '';
    const grant_type = 'authorization_code';
    
    const payload = {
      client_id,
      client_secret,
      redirect_uri,
      scope,
      grant_type,
      code,
    };

    const token = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    }).then(res => res.json());

    const user = await fetch('https://api.github.com/user', {
      headers: {
        'Context-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token.access_token}`,
      },
    }).then(res => res.json());

    console.log(payload, token, user);

    return user.login;
  }
}

