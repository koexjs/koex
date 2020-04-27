export { IVerify } from '@koex/passport';

import {
  OauthStrategy, IOauthStrategyOptions,
  IGetAuthorizeUrlData,
  IGetAccessTokenData,
} from './strategy';

export {
  OauthStrategy,
  IOauthStrategyOptions,
  IGetAuthorizeUrlData,
  IGetAccessTokenData,
}

export const Strategy = OauthStrategy;