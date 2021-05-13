import * as path from 'path';
import * as os from 'os';
// import { spawn } from 'child_process';
import * as cluster from 'cluster';
import graceful from '@koex/graceful';
import { getLogger } from '@zodash/logger';
import { delay } from '@zodash/delay';
import * as execa from 'execa';

export interface IProdOptions {
  project?: string;
}

export default async function build(options?: IProdOptions) {
  const project = options.project ?? process.cwd();
  const logger = getLogger('build');

  graceful(true);
  logger.info('start to build');
  const { stderr, exitCode } = await execa('tsc', {
    cwd: project,
  });
  if (exitCode !== 0) {
    process.stderr.write(stderr);
    process.exit(0);
  }

  logger.info('build done');
}