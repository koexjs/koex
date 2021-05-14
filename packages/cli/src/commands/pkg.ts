import { CreateCommandParameters, Command } from '@caporal/core';

import * as path from 'path';
import * as os from 'os';
// import { spawn } from 'child_process';
import * as cluster from 'cluster';
import graceful from '@koex/graceful';
import { getLogger } from '@zodash/logger';
import { delay } from '@zodash/delay';
import * as execa from 'execa';
import { exec } from 'pkg';

export interface IProdOptions {
  project?: string;
}

export async function pkg(options?: IProdOptions) {
  const project = options.project ?? process.cwd();
  // const entry = require(require.resolve(path.join(project, 'package.json')));

  const logger = getLogger('pkg');

  graceful(true);
  logger.info('start to pkg');
  // const { stderr, exitCode } = await execa(
  //   'pkg',
  //   [
  //     '--out-path', 'pkg',
  //     '--targets', 'node14-linux-x64,node14-macos-x64,node14-win-x64',
  //     '.',
  //   ],
  //   {
  //     cwd: project,
  //   },
  // );
  // if (exitCode !== 0) {
  //   process.stderr.write(stderr);
  //   process.exit(0);
  // }

  process.env.NODE_ENV = 'production';

  await exec([
    '--out-path',
    'pkg',
    '--targets',
    'node14-linux-x64,node14-macos-x64,node14-win-x64',
    '.',
  ]);

  logger.info('pkg done');
}

export default ({ createCommand }: CreateCommandParameters): Command => {
  return createCommand(
    'Packages the application into an executable that can be run even on devices without Node.js installed',
  )
    .option('-p, --project <project>', 'Project directory')
    .action(({ options }) => {
      return pkg(options);
    });
};
