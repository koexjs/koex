export { IGetUserByStrategyProfile } from '@koex/passport';
import {
  OauthStrategy,
  Profile,
} from './strategy';

import {
  IOauthStrategyOptions,
  IGetAuthorizeUrlData,
  IGetAccessTokenData,
  Config,
} from './config';

export {
  OauthStrategy,
  IOauthStrategyOptions,
  IGetAuthorizeUrlData,
  IGetAccessTokenData,
  Profile,
  Config,
}

export const Strategy = OauthStrategy;