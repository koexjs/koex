// import Koex, { Context } from '@koex/core';
// import passport, { OauthStrategy, IGetUserByStrategyProfile } from '@koex/passport';

// import * as qs from '@zcorky/query-string';
// import fetch from 'node-fetch';

// export interface GithubStrategyOptions {
//   client_id: string;
//   client_secret: string;
//   redirect_uri: string;
// }

// export class GithubStrategy extends OauthStrategy {
//   constructor(private readonly _options: GithubStrategyOptions, public readonly getUserByStrategyProfile: IGetUserByStrategyProfile) {
//     super({
//       ..._options,
//       response_type: 'code',
//       grant_type: 'authorization_code',
//       authorize_url: 'https://github.com/login/oauth/authorize',
//       token_url: 'https://github.com/login/oauth/access_token',
//       user_info_url: 'https://api.github.com/user',
//     }, getUserByStrategyProfile);
//   }

//   // public async user(id: string) {
//   //   return {
//   //     id,
//   //   };
//   // }

//   public async authenticate(ctx: Context) {
//     const auth_server_url = await this.getAuthorizeUrl();
//     ctx.redirect(auth_server_url);
//   }

//   public async callback(ctx: Context) {
//     const code = ctx.query.code;

//     const token = await this.getAccessToken(code);

//     const user = await this.getAccessUser(token.access_token);

//     console.log(token, user);

//     return {
//       id: user.login,
//     };
//   }
// }

export { GithubStrategy } from '@koex/passport-gihub';