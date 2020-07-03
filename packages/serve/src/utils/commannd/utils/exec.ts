import { spawn } from 'child_process';
// import execa from 'execa';

export class Shell {
  private onData: any;
  private onError: any;
  private onDone: any;
  
  constructor(private command: string, private options: any[]) {}
  
  on(type: 'data' | 'error', cb: (data: string) => void) {
    if (type === 'data') {
      this.onData = cb;
    }

    if (type === 'error') {
      this.onError = cb;
    }

    return this;
  }

  run() {
    const cmd = spawn(this.command, this.options);

    // console.log(this.fullCommand);

    cmd.stdout.on('data', (data) => {
      this.onData(data);
    });
  
    cmd.stderr.on('data', (error) => {
      this.onError(error);
    });
  
    cmd.on('close', (code) => {
      if (code === 0) {
        this.onDone();
      }
    });
  }

  done(cb: Function) {
    this.onDone = cb;

    return this;
  }

  public get fullCommand() {
    return [this.command, ...this.options].join(' ');
  }
}

export default (command: string, options: any[]) => {
  return new Shell(command, options);
};