#!/usr/bin/env node
import { resolve } from 'path';
import { program } from '@caporal/core';

const pkgPath = resolve(__dirname, '../package.json');
const commandsPath = resolve(__dirname, 'commands');

const { version } = require(pkgPath);

// console.log(pkgPath);
// console.log(commandsPath);

program.version(version).description('Koex App CLI').discover(commandsPath);

program.run();
