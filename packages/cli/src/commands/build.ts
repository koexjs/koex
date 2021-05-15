import { defineSubCommand } from '@cliz/cli';

import graceful from '@koex/graceful';
import { getLogger } from '@zodash/logger';
import * as execa from 'execa';

export interface IProdOptions {
  project?: string;
}

export async function build(options?: IProdOptions) {
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

export default defineSubCommand((createCommand) => {
  return createCommand('Compiles the application for production deployment')
    .option('-p, --project <project>', 'Project directory')
    .action(({ options }) => {
      return build(options);
    });
});
