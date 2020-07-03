import { Command } from 'commander';

export const program = new Command();

const pkg = require('../../../../package.json')

program
  .name('koex-serve')
  .version(pkg.version)
  .description(pkg.description)
  .option('-h, --host <PORT>', 'Listen port')
  .option('-p, --port <HOST>', 'Listen port')
  .option('-d, --dir <DIRECTORY>', 'Listen directory')
  .option('-c, --cors', 'Enable CORS')
  .option('-s, --single', 'Rewrite alk not-found requests to `index.html`')
  .option('-C, --cache', 'Cache files');

export default program;