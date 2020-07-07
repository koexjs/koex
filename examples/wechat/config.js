module.exports = {
  appId: 'wx714203b77d9b2261',
  appSecret: 'd7b97ac21a11df854b8145d97e53eeb5',
  accessTokenUrl: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appId}&secret={appSecret}`,
  jsapiTicketUrl: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token={accessToken}',
};
