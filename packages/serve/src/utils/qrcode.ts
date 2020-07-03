import * as qr from 'qrcode-terminal';

export default async function qrcode(text: string) {
  return new Promise(resolve => {
    qr.generate(text, { small: true }, qrcode => {
      return resolve(qrcode);
    });
  });
}