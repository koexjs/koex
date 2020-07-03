import Koex from '@koex/core';
import * as boxen from 'boxen';
import * as chalk from 'chalk';

import network from './network';
import qrcode from './qrcode';
import { Config } from '../type';

const PORT = Number(process.env.PORT) || 9000;
const HOST = process.env.HOST || '0.0.0.0';

export default async (app: Koex, config: Config) => {
  const server = app.listen(config.port, config.port, async () => {
  const details = server.address();
  const address = {
    local: `http://${config.host}:${config.port}`,
    network: 'unknown',
  };

  if (typeof details === 'string') {
    address.local = details;
  } else {
    const host = details.address === '::' ? 'localhost' : details.address;
    const port = details.port;
    const ip = network.getAddress();
    address.local = `http://${host}:${port}`;
    address.network = ip ? `http://${ip}:${port}` : 'unknown';
  }

  const message = `
${chalk.green('Serving!')}

- ${chalk.bold('Local')}:           ${address.local}
- ${chalk.bold('On Your Network')}: ${address.network}

${chalk.grey('Copied local address to clipboard!')}

${await qrcode(address.network)}`;
    
    console.log(boxen(message, {
      padding: 1,
      borderColor: 'green',
      margin: 1,
    }));
  });
}