export { IVerify } from '@koex/passport';
import { OauthStrategy } from './strategy';

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
  Config,
};

export const Strategy = OauthStrategy;
