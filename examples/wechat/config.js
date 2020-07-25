require('dotenv').config();

module.exports = {
  appId: process.env.APP_ID,
  appSecret: process.env.APP_SECRET,
  accessTokenUrl: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appId}&secret={appSecret}`,
  jsapiTicketUrl: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token={accessToken}',
};
