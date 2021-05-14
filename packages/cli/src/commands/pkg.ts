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
  targets?: string;
}

export type OS = 'linux' | 'macos' | 'win';
export type ARCH = 'x64' | 'arm';

const NODE_VERSION = '14';
const DEFAULT_TARGETS = [
  getTarget('linux', 'x64'),
  getTarget('macos', 'x64'),
  getTarget('win', 'x64'),
].join(',');

/**
 * Get Bin Target
 *
 * @param os system os
 * @param arch device arch
 * @returns
 *
 * @example
 *   node14-linux-x64
 *   node14-macos-x64
 *   node14-win-x64
 */
function getTarget(os: OS, arch: ARCH) {
  return `node${NODE_VERSION}-${os}-${arch}`;
}

/**
 * Get pkg support targets
 *
 * @param targets OS-ARCH
 * @returns NODE-OS-ARCH
 *
 * @example
 *    linux-x64
 *    macos-x64
 *    macos-arm
 *    win-x64
 */
function getTargets(targets?: string) {
  if (!targets) {
    return DEFAULT_TARGETS;
  }

  return targets
    .split(',')
    .map((target) => {
      const [os, arch] = target.trim().split('-') as [OS, ARCH];
      return getTarget(os, arch);
    })
    .join(',');
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

  const targets = getTargets(options.targets);

  await exec(['--out-path', 'pkg', '--targets', targets, '.']);

  logger.info('pkg done');
}

export default ({ createCommand }: CreateCommandParameters): Command => {
  return createCommand(
    'Packages the application into an executable that can be run even on devices without Node.js installed',
  )
    .option('-p, --project <project>', 'Project directory')
    .option(
      '-t, --targets <targets>',
      'Comma-separated list of targets (Ex: linux-x64,macos-x64,macos-arm,win-x64)',
    )
    .action(({ options }) => {
      return pkg(options);
    });
};
