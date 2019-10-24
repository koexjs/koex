export { IGetUserByStrategyProfile } from '@koex/passport';
import {
  OauthStrategy, IOauthStrategyOptions,
  IGetAuthorizeUrlData,
  IGetAccessTokenData,
  Profile,
} from './strategy';

export {
  OauthStrategy,
  IOauthStrategyOptions,
  IGetAuthorizeUrlData,
  IGetAccessTokenData,
  Profile,
}

export const Strategy = OauthStrategy;