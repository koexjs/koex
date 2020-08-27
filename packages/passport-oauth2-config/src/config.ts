export interface Config {
  /**
   * Authenticate Flow
   *  all data in query to redirect
   */
  authenticate?: {};

  /**
   * Callback Flow
   */
  callback?: {
    // @1 code, used to get access_token
    code?: {
      /**
       * Code Name, default: code,
       *  maybe some use ticket
       */
      name?: string;
    };

    // @2 access token, used to get user profile
    access_token?: {
      /**
       * The method to get access token, default: POST
       * But some use GET (unsafe)
       */
      method?: 'POST' | 'GET' | 'PUT';

      /**
       * The header to get access token,
       *  default:
       *    Content-Type: application/json
       *    Accept: application/json
       *
       *  But some use
       *    Content-Type: application/x-www-form-urlencoded
       *  and others
       */
      headers?: Record<string, string>;

      /**
       * The query to get access token, default: ''
       * But some place body in query, like coding.net
       *  { code: '{code}' }
       */
      query?: Record<string, string>;

      /**
       * The body to get access token
       *  0 about code
       *    default: { code: '{code}' }
       *  1.according the Content-Type
       *    1.1 application/json => json string
       *    1.2 application/x-www-form-urlencoded => url encoded string
       *  2.according some server will place it in query, like coding.net
       */
      body?: Record<string, string>;

      /**
       * The full access_token
       */
      access_token?: {
        /**
         * The real access_token string name,
         *  default: access_token,
         *  which means the access_token string is access_token.access_token
         */
        name?: string;
      };
    };

    // @3 user profile, used to connect with local user
    user_profile?: {
      /**
       * The method to get user profile, default: GET
       * But some use POST
       */
      method?: 'GET' | 'POST';

      /**
       * The header to get user profile,
       *  default:
       *    Accept: application/json
       *    Authorization: Bearer {access_token} @important
       *
       *  But some use
       *    Authentication: {access_token}
       *  and others
       */
      headers?: Record<string, string>;

      /**
       * The query to get user profile, default: ''
       * But some place body in query, like coding.net
       *  query: ?access_token={acccess_token}
       *  here: { access_token: '{access_token}' }
       */
      query?: Record<string, string>;

      /**
       * The body to get user profile
       *  default: {}
       * But some use: { access_token: '{access_token}' }
       */
      body?: Record<string, string>;

      /**
       * The full profile
       */
      profile?: {
        /**
         * The Unique Id or OpenId map, default: id
         *  like github, you can use data.login or data.id
         */
        id?: string;

        /**
         * The Username map, default: username
         *  like github, you can use data.login
         */
        username?: string;

        /**
         * The Nickname map, default: nickname
         *  like github, you can use data.name
         */
        nickname?: string;

        /**
         * The Email map, default: email
         *  like github, you can use data.email, but scope should have email
         */
        email?: string;

        /**
         * The Avatar map, default: avatar
         *  like github, you can use data.avatar_url
         */
        avatar?: string;

        // allow custom key
        [key: string]: any;
      };
    };
  };
}

export interface IOauthStrategyOptions {
  /**
   * Client ID
   */
  client_id: string;

  /**
   * Client ID
   */
  client_secret: string;

  /**
   * Redirect URI (callback url)
   */
  redirect_uri: string;

  /**
   * Scope / Permission
   */
  scope?: string;

  /**
   * State / Security
   */
  state?: string;

  /**
   * Response Type
   *  default: code
   */
  response_type?: string;

  /**
   * Grant Type
   *  default: authorization_code
   */
  grant_type?: string;

  /**
   * Authorize Url
   */
  authorize_url: string;

  /**
   * Token Url
   */
  token_url: string;

  /**
   * User Info Url
   */
  user_profile_url: string;
}

export interface IGetAuthorizeUrlData {
  /**
   * Client ID
   */
  client_id: string;

  /**
   * Redirect URI (callback url)
   */
  redirect_uri: string;

  /**
   * Response Type
   *  default: code
   */
  response_type?: string;

  /**
   * Scope / Permission
   */
  scope?: string;

  /**
   * State / Security
   */
  state?: string;
}

export interface CommonAccessTokenData {
  /**
   * Client ID
   */
  client_id: string;

  /**
   * Client ID
   */
  client_secret: string;

  /**
   * Grant Type
   *  default: authorization_code
   *  all:
   *    1.authorization_code
   *    2.refresh_token
   *    3.password
   *    4.client_credentials
   */
  grant_type?: string;
}

// @MODE authorization_code
export interface AuthorizationCodeAccessTokenData extends CommonAccessTokenData {
  grant_type: 'authorization_code';

  /**
   * Redirect URI (callback url)
   */
  redirect_uri: string;

  /**
   * Scope / Permission
   */
  scope?: string;

  /**
   * Authorization Code
   */
  code: string;
}

// @MODE refresh_token
export interface RefreshTokenAccessTokenData extends CommonAccessTokenData {
  grant_type: 'refresh_token';

  /**
   * Refresh Token
   */
  refresh_token: string;
}

// @MODE password
export interface PasswordAccessTokenData extends CommonAccessTokenData {
  grant_type: 'password';

  /**
   * Username
   */
  username: string;

  /**
   * Password
   */
  password: string;
}

// @MODE client_credentails
export interface ClientCredentialsAccessTokenData extends CommonAccessTokenData {
  grant_type: 'client_credentails';

  /**
   * client_credentails
   */
  client_credentails: string;
}


export type IGetAccessTokenData = AuthorizationCodeAccessTokenData | RefreshTokenAccessTokenData | PasswordAccessTokenData | ClientCredentialsAccessTokenData;