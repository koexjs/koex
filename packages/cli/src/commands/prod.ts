import * as path from 'path';
import * as os from 'os';
// import { spawn } from 'child_process';
import * as cluster from 'cluster';
import graceful from '@koex/graceful';
import { getLogger } from '@zodash/logger';
import { delay } from '@zodash/delay';

export interface IProdOptions {
  port?: string;
  host?: string;
  project?: string;
  entry?: string;
  cpu?: number;
}

export default async function prod(options?: IProdOptions) {
  const host = process.env.HOST ?? options.host ?? '0.0.0.0';
  const port = process.env.PORT ?? options.port ?? '';
  const project = options.project ?? process.cwd();
  const entry =
    options.entry ?? require(path.join(project, 'package.json')).main;

  const logger = getLogger('cluster');

  // const node = spawn('node', [dir, entry], {
  //   stdio: 'inherit',
  //   // cwd: dir,
  //   env: {
  //     ...process.env,
  //     HOST: host,
  //     PORT: port,
  //   },
  // });

  graceful(true);

  if (cluster.isMaster) {
    logger.info(`Master ${process.pid} is running`);

    // Fork workers.
    const numCPUs = +options.cpu || os.cpus().length;
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.info(
        `worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`,
      );

      delay(1000);
      cluster.fork(true);
    });
  } else {
    process.env.HOST = host;
    process.env.PORT = port;
    process.env.NODE_ENV = 'production';

    logger.info(`Worker ${process.pid} started`);
    require(path.join(project, entry));
  }
}
