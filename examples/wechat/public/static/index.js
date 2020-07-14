// document.body.style.background = 'red'

function getJsapiSign() {
  const url = '/wechat/jsapi_sign';
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: window.location.href.split('#')[0],
    }),
  }).then(res => res.json());
}

function register() {
  return getJsapiSign().then(({ appId, timestamp, nonceStr, signature }) => {

    console.log('data: ', appId, timestamp, nonceStr, signature);

    wx.config({
      debug: true,
      appId: appId,
      timestamp: timestamp,
      nonceStr: nonceStr,
      signature: signature,
      jsApiList: [
        'onMenuShareAppMessage',
        'onMenuShareTimeline',
        'startRecord',
        'stopRecord',
        // 'translateVoice',
        // 'onVoiceRecordEnd',
        // 'playVoice',
        // 'stopVoice',
        // 'uploadVoice',
        // 'downloadVoice',
        // 'chooseImage',
        // 'scanQRCode',
      ],
    });

    wx.ready(function () {
      console.log('ready');
      const data = {
        title: '测试JSSDK',
        desc: '后端签名测试',
        link: window.location.href.split('#')[0],
        imgUrl: 'https://s1.ax1x.com/2020/06/08/tRTCyd.th.jpg',
        success() {
          alert('分享成功');
        },
      };
      wx.onMenuShareTimeline(data);
      wx.onMenuShareAppMessage(data);
    });

    wx.error(function (res) {
      console.log('error: ', res);
      // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
    });

  });
}

register().then(console.log);