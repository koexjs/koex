#!/usr/bin/env node
import { resolve } from 'path';
import { createMultiCommandsProgram } from '@cliz/cli';

const pkgPath = resolve(__dirname, '../package.json');
// const commandsPath = resolve(__dirname, 'commands');

const { version } = require(pkgPath);

// console.log(pkgPath);
// console.log(commandsPath);

// program.version(version).description('Koex App CLI').discover(commandsPath);

const program = createMultiCommandsProgram('koex', __dirname, {
  version,
});

program.run();
