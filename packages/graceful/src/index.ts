import { getLogger } from '@zodash/logger';
import * as kill from 'tree-kill';

export class Graceful {
  private logger = getLogger('graceful process');

  constructor(private readonly silent?: boolean) {}

  private log(message: string) {
    // process.stdout.write(`[${process.pid}]: ${message}\n`);
    this.logger.info(`[${process.pid}]: ${message}`);
  }

  private onSignal(signal: string) {
    this.log(`Received signal: ${signal}.`);

    process.exit(128);
  }

  public start() {
    this.onExit();
    this.onUncaughtException();
    this.onUnhandleRejection();

    this.log('start.');
  }

  public onExit() {
    process.on('exit', (exitCode) => {
      !this.silent && this.log(`Exit with code ${exitCode}`);

      kill(process.pid);
    });

    process.on('SIGINT', this.onSignal);

    // Windows => Ctrl + Break
    process.on('SIGBREAK', this.onSignal);

    // Close terminal
    process.on('SIGHUP', this.onSignal);
  }

  public onUncaughtException() {
    process.on('uncaughtException', function (err) {
      console.error('Error caught in uncaughtException event:', err);
    });
  }

  public onUnhandleRejection() {
    process.on('unhandledRejection', function (reason, promise) {
      console.error('Unhandled Reject at:', promise, 'reason:', reason);
    });
  }
}

export function graceful(silent?: boolean) {
  const instance = new Graceful(silent);
  instance.start();
}

export default graceful;
