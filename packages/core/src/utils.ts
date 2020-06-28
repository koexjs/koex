import App from './index';
import { Context } from './types';

const ServiceSymbol = Symbol('Service');

/**
 * @Lazy Create instance of class, make method as middleware
 * 
 * @param Controller Controller Class
 */
export function wrapController<T>(Controller: any): T {
  let proto = Controller.prototype;
  const instance = {} as object;

  while (proto !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(proto);

    for (const key of keys) {
      if (key === 'constructor') {
        continue;
      }

      const d = Object.getOwnPropertyDescriptor(proto, key);
      // @1 skip getter, setter & non-function properties
      // @2 prevent to override sub method
      if (typeof d.value === 'function' && !instance.hasOwnProperty(key)) {
        instance[key] = methodToMiddleware(Controller, key);
      }
    }

    proto = Object.getPrototypeOf(proto);
  }

  return instance as any as T;

  function methodToMiddleware(Controller: any, key: string) {
    return async (ctx: any, next: any) => {
      const controller = new Controller(ctx);

      return controller[key].call(controller, ctx, next);
    };
  }
}

export function createControllers<T>(cts: Record<string, any>) {
  return Object.keys(cts)
    .reduce((all, key) => {
      all[key] = wrapController(cts[key]);
      return all;
    }, {} as T);
}

export class ClassLoader {
  private cache = new Map();

  constructor(private ctx: Context, private services: Record<string, any>) {
    for (const serviceName in services) {
      this.define(serviceName, services[serviceName]);
    }
  }
  
  define(property: string, Cs: any) {
    const target = this;

    Object.defineProperty(target, property, {
      get() {
        let instance = target.cache.get(property);

        if (!instance) {
          instance = new Cs(target.ctx);
          target.cache.set(property, instance);
        }

        return instance;
      },
    });
  }
}

export function createServices(app: App, serviceClasses: Record<string, any>) {
  Object.defineProperty(app.context, 'services', {
    get() {
      if (this[ServiceSymbol]) {
        return this[ServiceSymbol];
      }

      this[ServiceSymbol] = new ClassLoader(this, serviceClasses);

      return this[ServiceSymbol];
    },
  });
}

export function extendsContext<T>(app: App, proterty: string, value: T) {
  Object.defineProperty(app.context, proterty, {
    get() {
      return value;
    },
  });
}

export function extendsApplication<T>(app: App, proterty: string, value: T) {
  Object.defineProperty(app, proterty, {
    get() {
      return value;
    },
  });
}