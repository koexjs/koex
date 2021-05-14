import { CreateCommandParameters, Command } from '@caporal/core';

import { resolve } from 'path';
import { promises as fs } from 'fs';
import * as os from 'os';
// import { spawn } from 'child_process';
import * as cluster from 'cluster';
import graceful from '@koex/graceful';
import { getLogger } from '@zodash/logger';
import { delay } from '@zodash/delay';
import * as execa from 'execa';
import api from '@cliz/core';

import { exec as execPkg } from 'pkg';
import * as execNcc from '@zeit/ncc';

export interface IProdOptions {
  entry?: string;
  project?: string;
  targets?: string;
  useNcc?: boolean;
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
  const logger = getLogger('pkg');

  const project = options.project ?? process.cwd();
  const targets = getTargets(options.targets);

  const { main, bin } = await api.fs.loadJSON(resolve(project, 'package.json'));

  const entry = resolve(project, options.entry ?? main);
  const binName = Object.keys(bin ?? {})[0] ?? 'cli';

  //
  const pkgDir = resolve(project, 'pkg');

  // graceful(true);
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

  console.log('entry:', entry);
  await api.fs.mkdirp(pkgDir);

  // @TODO current is broken
  if (options.useNcc) {
    const nccBin = resolve(__dirname, '../..', 'node_modules/.bin', 'ncc');
    const nccOutDir = resolve(pkgDir, 'ncc');
    const nccDefaultEntry = resolve(nccOutDir, 'index.js');
    const nccEntry = resolve(nccOutDir, `${binName}.js`);

    // const { code, map, assets } = await execNcc(entry, {
    //   caches: resolve(project, './node_modules/.cache/koex_cli_ncc_cache'),
    //   // minify: true,
    //   // sourceMap: false,
    //   // sourceMapRegister: false,
    //   // quiet: true,
    //   // filterAssetBase: project,
    // });
    // await api.fs.writeFile(nccOutpath, code);
    // console.log('map: ', map, assets);

    await execa(
      nccBin,
      ['build', entry, '-o', nccOutDir, '-m', '--no-source-map-register'],
      {
        cwd: project,
      },
    );
    await fs.rename(nccDefaultEntry, nccEntry);

    await execPkg(['--out-path', pkgDir, '--targets', targets, nccEntry]);
  } else {
    await execPkg(['--out-path', pkgDir, '--targets', targets, project]);
  }

  logger.info('pkg done');
}

export default ({ createCommand }: CreateCommandParameters): Command => {
  return createCommand(
    'Packages the application into an executable that can be run even on devices without Node.js installed',
  )
    .option('-e, --entry <entry>', 'Specify entry')
    .option('-p, --project <project>', 'Project directory')
    .option(
      '-t, --targets <targets>',
      'Comma-separated list of targets (Ex: linux-x64,macos-x64,macos-arm,win-x64)',
    )
    .option('--use-ncc', 'Use @zeit/ncc improve build size')
    .action(({ options }) => {
      return pkg(options);
    });
};
