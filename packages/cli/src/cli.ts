#!/usr/bin/env node
import { join } from 'path';
import { program } from '@caporal/core';

const pkgPath = join(__dirname, '../package.json');
const commandsPath = join(__dirname, 'commands');

const { version } = require(pkgPath);

console.log(pkgPath);
console.log(commandsPath);

program.version(version).description('Koex App CLI').discover(commandsPath);

program.run();
