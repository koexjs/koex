import { Server } from 'http';
import * as typings from '@koex/core';
import App from '@koex/core';

function defineReadonlyProperties(target: Object, properties: Record<string, any>) {
  for (const propertyKey in properties) {
    Object.defineProperty(target, propertyKey, {
      enumerable: true,
      get() {
        return properties[propertyKey];
      },
      set(value: any) {
        const targetName = target.constructor && target.constructor.name || 'unknown';
        throw new Error(`Readonly property (${propertyKey}) in ${targetName}`);
      },
    })
  }
}

declare module '@koex/core' {
  export interface Config {

  }

  export interface Helpers {

  }

  export interface Middlewares {

  }

  export interface Models {

  }

  export interface Services {

  }

  export interface Applications {

  }

  export interface Routes {

  }

  interface Koex {
    readonly bootInfo: BootInfo;
    readonly config: Config;
    readonly helpers: Helpers;
    readonly middlewares: Middlewares;
    readonly models: Models;
    readonly services: Services;
    readonly applications: Applications;
    readonly routes: Routes;
  }
}

export type Loader<R> = (app: App) => Promise<R>;

export interface BootInfo {
  system: any;
  bootStartedAt: Date;
  bootTime: number;
  runningStartedAt: Date;
  uptime: number;
}

export class Bootstrap {
  private composesFns: (() => Promise<any>)[] = [];

  constructor(public readonly app = new App()) {
    if (!('bootInfo' in app)) {
      const bootInfo = {
        bootStartedAt: new Date(),
      } as any as BootInfo;
  
      defineReadonlyProperties(app, {
        bootInfo,
      });
    }
  }

  loadConfig(fn: Loader<typings.Config>) {
    const { app } = this;

    this.composesFns.push(async () => {
      const config = await fn(app);
      
      defineReadonlyProperties(app, {
        config,
      });
    });

    return this;
  }

  loadHelpers(fn: Loader<typings.Helpers>) {
    const { app } = this;
    
    this.composesFns.push(async () => {
      const helpers = await fn(app);
      
      defineReadonlyProperties(app, {
        helpers,
      });
    });

    return this;
  }

  loadMiddlewares(fn: Loader<typings.Middlewares>) {
    const { app } = this;
    
    this.composesFns.push(async () => {
      const middlewares = await fn(app);
      
      defineReadonlyProperties(app, {
        middlewares,
      });
    });

    return this;
  }

  loadModels(fn: Loader<typings.Models>) {
    const { app } = this;
    
    this.composesFns.push(async () => {
      const models = await fn(app);
      
      defineReadonlyProperties(app, {
        models,
      });
    });

    return this;
  }

  loadServices(fn: Loader<typings.Services>) {
    const { app } = this;
    
    this.composesFns.push(async () => {
      const services = await fn(app);
      
      defineReadonlyProperties(app, {
        services,
      });
    });

    return this;
  }

  loadApplications(fn: Loader<typings.Applications>) {
    const { app } = this;
    
    this.composesFns.push(async () => {
      const applications = await fn(app);
      
      defineReadonlyProperties(app, {
        applications,
      });
    });

    return this;
  }

  loadRoutes(fn: Loader<typings.Routes>) {
    const { app } = this;
    
    this.composesFns.push(async () => {
      const routes = await fn(app);
      
      defineReadonlyProperties(app, {
        routes,
      });
    });

    return this;
  }

  async prepare() {
    const { app } = this;

    for (const step of this.composesFns) {
      await step();
    }

    return new Bootstrap(app);
  }

  async startServer(): Promise<Server> {
    const { app } = this;

    return new Promise((resolve, reject) => {
      const port = ~~process.env.PORT || (app.config as any).port || 8080;
      const host = process.env.HOST || (app.config as any).host || '127.0.0.1';
  
      const server = this.app.listen(port, host, () => {
        defineReadonlyProperties(app.bootInfo, {
          bootTime: (new Date() as any) - (app.bootInfo.bootStartedAt as any),
          runningStartedAt: new Date(),
        });

        Object.defineProperty(app.bootInfo, 'uptime', {
          enumerable: true,
          get() {
            return (new Date() as any) - (app.bootInfo.runningStartedAt as any);
          },
        });

        resolve(server);
      });
    })
  }
}

export function bootstrap(app?: App) {
  return new Bootstrap(app);
}

export default bootstrap;