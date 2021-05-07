import { Server } from 'http';
import * as typings from '@koex/core';
import App, { Context } from '@koex/core';
import * as boxen from 'boxen';
import * as chalk from 'chalk';
import * as os from 'os';

const interfaces = os.networkInterfaces();

function defineReadonlyProperties(
  target: Object,
  properties: Record<string, any>,
) {
  for (const propertyKey in properties) {
    Object.defineProperty(target, propertyKey, {
      enumerable: true,
      get() {
        return properties[propertyKey];
      },
      set(value: any) {
        const targetName =
          (target.constructor && target.constructor.name) || 'unknown';
        throw new Error(`Readonly property (${propertyKey}) in ${targetName}`);
      },
    });
  }
}

export const getNetworkAddress = () => {
  for (const fields of Object.values(interfaces)) {
    for (const interf of fields) {
      const { address, family, internal } = interf;
      if (family === 'IPv4' && !internal) {
        return address;
      }
    }
  }
};

function createTimer(name: string, logger = console) {
  const start = process.hrtime();

  return {
    done: () => {
      const d = process.hrtime(start);
      const time = d[0] * 1e3 + d[1] / 1e6;

      logger.info.apply(logger, [`[load][${name}]`, `+${time.toFixed(3)}ms`]);
    },
  };
}

declare module '@koex/core' {
  export interface Config {}

  export interface Helpers {}

  export interface Middlewares {}

  export interface Models {}

  export interface Services {}

  export interface Controllers {}

  export interface Routes {}

  export interface Application {
    readonly bootInfo: BootInfo;
    readonly config: Config;
    // readonly helpers: Helpers;
    readonly middlewares: Middlewares;
    // readonly models: Models;
    readonly services: Services;
    readonly controllers: Controllers;
    readonly routes: Routes;
  }

  export interface Context {
    readonly config: Config;
    readonly helpers: Helpers;
    // readonly models: Models;
    // readonly services: Services;
  }
}

export type Loader<R> = (app: App) => Promise<R | void>;

export interface BootInfo {
  system: any;
  bootStartedAt: Date;
  bootTime: number;
  runningStartedAt: Date;
  uptime: number;
}

export class Bootstrap {
  private composeLoaders: { name: string; loader: () => Promise<any> }[] = [];

  constructor(public readonly app = new App()) {
    if (!('bootInfo' in app)) {
      const bootInfo = ({
        bootStartedAt: new Date(),
      } as any) as BootInfo;

      defineReadonlyProperties(app, {
        bootInfo,
      });
    }
  }

  private registerLoader(name: string, loader: () => Promise<void>) {
    this.composeLoaders.push({
      name,
      loader,
    });

    return this;
  }

  private async runLoader(name: string, loader: () => Promise<void>) {
    const { app } = this;
    const timer = createTimer(name, app.logger as any);

    try {
      await loader();
    } catch (error) {
      app.logger.error(error);
    } finally {
      timer.done();
    }
  }

  private extendsApplication(key: string, value: any) {
    const { app } = this;

    defineReadonlyProperties(app, {
      [key]: value,
    });
  }

  private extendContext(key: string, value: any) {
    const { app } = this;

    app.use(async (ctx, next) => {
      ctx[key] = value;

      return await next();
    });
  }

  private extends(
    key: string,
    value: any,
    options?: { app?: boolean; context?: boolean },
  ) {
    const isApp = options?.app ?? true;
    const isContext = options?.context ?? false;

    if (isApp) {
      this.extendsApplication(key, value);
    }

    if (isContext) {
      this.extendContext(key, value);
    }
  }

  loadConfig(fn: Loader<typings.Config>) {
    const { app } = this;

    this.registerLoader('config', async () => {
      const config = await fn.apply(this, app);

      if (config) {
        this.extends('config', config, {
          app: true,
          context: true,
        });
      }
    });

    return this;
  }

  loadHelpers(fn: Loader<typings.Helpers>) {
    const { app } = this;

    this.registerLoader('helpers', async () => {
      const helpers = await fn.apply(this, app);

      if (helpers) {
        this.extends('helpers', helpers, {
          app: false,
          context: true,
        });
      }
    });

    return this;
  }

  loadMiddlewares(fn: Loader<typings.Middlewares>) {
    const { app } = this;

    this.registerLoader('middlewares', async () => {
      const middlewares = await fn.apply(this, app);

      if (middlewares) {
        this.extends('middlewares', middlewares, {
          app: true,
          context: false,
        });
      }
    });

    return this;
  }

  loadModels(fn: Loader<typings.Models>) {
    const { app } = this;

    this.registerLoader('models', async () => {
      const models = await fn.apply(this, app);

      if (models) {
        this.extends('models', models, {
          app: true,
          context: true,
        });
      }
    });

    return this;
  }

  loadServices(fn: Loader<typings.Services>) {
    const { app } = this;

    this.registerLoader('services', async () => {
      const services = await fn.apply(this, app);

      if (services) {
        this.extends('services', services, {
          app: true,
          context: true,
        });
      }
    });

    return this;
  }

  loadControllers(fn: Loader<typings.Controllers>) {
    const { app } = this;

    this.registerLoader('controllers', async () => {
      const controllers = await fn.apply(this, app);

      if (controllers) {
        this.extends('controllers', controllers, {
          app: true,
          context: false,
        });
      }
    });

    return this;
  }

  loadRoutes(fn: Loader<typings.Routes>) {
    const { app } = this;

    this.registerLoader('routes', async () => {
      const routes = await fn.apply(this, app);

      if (routes) {
        this.extends('routes', routes, {
          app: true,
          context: false,
        });
      }
    });

    return this;
  }

  async prepare() {
    const { app, runLoader } = this;

    for (const { name, loader } of this.composeLoaders) {
      await runLoader.apply(this, [name, loader]);
    }

    return new Bootstrap(app);
  }

  private showBootMessage(server: Server, host: string, port: number) {
    const { app } = this;

    app.logger.info('[bootloader] start at:', app.bootInfo.bootStartedAt);
    app.logger.info(
      '[bootloader] load time:',
      `${app.bootInfo.bootTime.toFixed(3)}ms`,
    );
    app.logger.info('[bootloader] running at:', app.bootInfo.runningStartedAt);

    const details = server.address();
    const address = {
      local: `http://${host}:${port}`,
      network: 'unknown',
    };

    if (typeof details === 'string') {
      address.local = details;
    } else {
      const host =
        ['::', '0.0.0.0'].indexOf(details.address) !== -1
          ? 'localhost'
          : details.address;
      const port = details.port;
      const ip = getNetworkAddress();
      address.local = `http://${host}:${port}`;
      address.network = ip ? `http://${ip}:${port}` : 'unknown';
    }

    const message = `
    ${chalk.green('Serving!')}
    
    - ${chalk.bold('Local')}:           ${address.local}
    - ${chalk.bold('On Your Network')}: ${address.network}
    
    ${chalk.grey('Copied local address to clipboard!')}
      `;

    console.log(
      boxen(message, {
        padding: 1,
        borderColor: 'green',
        margin: 1,
      }),
    );
  }

  async startServer(): Promise<Server> {
    const { app, showBootMessage } = this;

    return new Promise((resolve, reject) => {
      const port = ~~process.env.PORT || (app.config as any)?.port || 8080;
      const host = process.env.HOST || (app.config as any)?.host || '127.0.0.1';

      const server = app.listen(port, host, () => {
        defineReadonlyProperties(app.bootInfo, {
          bootTime: +new Date() - +app.bootInfo.bootStartedAt,
          runningStartedAt: new Date(),
        });

        Object.defineProperty(app.bootInfo, 'uptime', {
          enumerable: true,
          get() {
            return (+new Date() as any) - +app.bootInfo.runningStartedAt;
          },
        });

        showBootMessage.apply(this, [server, host, port]);

        resolve(server);
      });
    });
  }
}

export function bootstrap(app?: App) {
  return new Bootstrap(app);
}

export default bootstrap;
