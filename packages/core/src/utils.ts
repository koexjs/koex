import * as mongoose from 'mongoose';
import App, { Context } from './index';

const ModelSymbol = Symbol('Model');
const ServiceSymbol = Symbol('Service');

/**
 * @Lazy Create instance of class, make method as middleware
 *
 * @param ControllerClass Controller Class
 */
export function instanceController<T>(ControllerClass: T): T {
  let proto = (ControllerClass as any).prototype;
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
      if (typeof d?.value === 'function' && !instance.hasOwnProperty(key)) {
        instance[key] = methodToMiddleware(ControllerClass, key);
      }
    }

    proto = Object.getPrototypeOf(proto);
  }

  return (instance as any) as T;

  function methodToMiddleware(Controller: any, key: string) {
    return async (ctx: any, next: any) => {
      const controller = new Controller(ctx);

      return controller[key].call(controller, ctx, next);
    };
  }
}

/**
 * instance Controllers
 *
 * @param ControllerClassesOrNest Class Or Object of Class
 * @returns class instances
 *
 * @example
 *  // plain
 *  instanceControllers({
 *    user: UserController,
 *  })
 *
 * @example
 *  // nest
 *  instanceControllers({
 *    v1: {
 *      user: UserController,
 *    },
 *  });
 */
export function instanceControllers<T>(
  ControllerClassesOrNest: Record<string, any>,
) {
  const typeOf = (v: any) => Object.prototype.toString.call(v);
  const isFunction = (v: any) => typeOf(v) === '[object Function]';
  const isPlainObject = (v: any) => typeOf(v) === '[object Object]';

  return Object.keys(ControllerClassesOrNest).reduce((all, key) => {
    const ClassOrObject = ControllerClassesOrNest[key];

    // 1. class
    if (isFunction(ClassOrObject)) {
      all[key] = instanceController(ClassOrObject);
    } else if (isPlainObject(ClassOrObject)) {
      // nest { name: ControllerClass }
      all[key] = instanceControllers(ClassOrObject);
    } else {
      // ignore
      throw new Error(
        `Unknown Controller Type (key: ${key}, type: ${typeOf(ClassOrObject)})`,
      );
    }

    return all;
  }, {} as T);
}

export function createControllers<T>(
  app: App,
  ControllerClassesOrNest: Record<string, any>,
) {
  Object.defineProperty(app, 'controllers', {
    get() {
      return instanceControllers<T>(ControllerClassesOrNest);
    },
  });
}

export class ClassesLoader {
  private cache = new Map();

  constructor(
    private ctx: Context,
    private ClassesOrNest: Record<string, any>,
  ) {
    for (const serviceName in ClassesOrNest) {
      this.define(serviceName, ClassesOrNest[serviceName]);
    }
  }

  define(property: string, ClassOrObject: any) {
    const target = this;
    const typeOf = (v: any) => Object.prototype.toString.call(v);
    const isFunction = (v: any) => typeOf(v) === '[object Function]';
    const isPlainObject = (v: any) => typeOf(v) === '[object Object]';

    Object.defineProperty(target, property, {
      get() {
        let instance = target.cache.get(property);

        if (!instance) {
          // 1. class
          if (isFunction(ClassOrObject)) {
            instance = new ClassOrObject(target.ctx);
          } else if (isPlainObject(ClassOrObject)) {
            instance = new ClassesLoader(this.ctx, ClassOrObject);
          } else {
            // ignore
            throw new Error(
              `Unknown Service Type (key: ${property}, type: ${typeOf(
                ClassOrObject,
              )})`,
            );
          }

          target.cache.set(property, instance);
        }

        return instance;
      },
    });
  }
}

export class ServicesClassLoader extends ClassesLoader {}

export function createServices(app: App, serviceClasses: Record<string, any>) {
  Object.defineProperty(app.context, 'services', {
    get() {
      if (this[ServiceSymbol]) {
        return this[ServiceSymbol];
      }

      this[ServiceSymbol] = new ServicesClassLoader(this, serviceClasses);

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

// ----
export class ModelClassLoader {
  private cache = new Map();

  constructor(
    private ctx: Context,
    models: Record<string, any>,
    compatibleModels?: any,
  ) {
    for (const modelName in models) {
      this.define(modelName, models[modelName]);
    }

    // @TODO
    if (compatibleModels) {
      for (const modelName in compatibleModels) {
        this.defineCompatible(modelName, compatibleModels[modelName]);
      }
    }
  }

  private define(property: string, Cs: any) {
    const target = this;

    Object.defineProperty(target, property, {
      get() {
        let instance = target.cache.get(property);

        if (!instance) {
          // @TODO
          instance = new Cs(target).build();
          target.cache.set(property, instance);
        }

        return instance;
      },
    });
  }

  // @DEPRECIATED
  private defineCompatible(property: string, model: any) {
    const target = this;

    Object.defineProperty(target, property, {
      get() {
        let instance = target.cache.get(property);

        if (!instance) {
          instance = model;
          target.cache.set(property, instance);
        }

        // @TODO
        return instance;
      },
    });
  }
}

export function createModels(
  app: App,
  modelClasses: Record<string, any>,
  compatibleModels?: any,
) {
  Object.defineProperty(app, 'models', {
    get() {
      if (this[ModelSymbol]) {
        return this[ModelSymbol];
      }

      this[ModelSymbol] = new ModelClassLoader(
        this,
        modelClasses,
        compatibleModels,
      );

      return this[ModelSymbol];
    },
  });

  Object.defineProperty(app.context, 'models', {
    get() {
      return app.models;
    },
  });
}

// ------
export type SchemaDefination = ConstructorParameters<
  typeof mongoose.Schema
>['0'];
export type SchemaOptions = ConstructorParameters<typeof mongoose.Schema>['1'];

export type ICreateSchema = (
  defination: SchemaDefination,
  options?: SchemaOptions,
) => mongoose.Schema;
export type IRegisterModel = <T extends mongoose.Model<any>>(
  name: string,
  schema: mongoose.Schema,
) => T;

export type ISchemaUtils = {
  mongoose: typeof mongoose;
  Schema: typeof mongoose.Schema;
  Types: typeof mongoose.Schema.Types;
  //
  ObjectId: typeof mongoose.Schema.Types.ObjectId;
  //
};

export type ICreateModel<T> = (
  createSchema: ICreateSchema,
  registerModel: IRegisterModel,
  schemaUtils?: ISchemaUtils,
) => T;

export function createModel<T>(fn: ICreateModel<T>): T {
  const Schema = mongoose.Schema;
  const Types = Schema.Types;

  const baseDefination = {
    creator: {
      type: Types.ObjectId,
    },
    modifier: {
      type: Types.ObjectId,
    },
    // createdAt: {
    //   type: Types.Date,
    //   default: Date.now,
    // },
    // updatedAt: {
    //   type: Types.Date,
    //   default: Date.now,
    // },
  };

  const createSchema: ICreateSchema = (
    defination: SchemaDefination,
    options?: SchemaOptions,
  ) => {
    return new Schema(
      {
        ...defination,
        ...baseDefination,
      },
      {
        ...options,
        timestamps: true,
      },
    );
  };

  const registerModel: IRegisterModel = <T extends mongoose.Model<any>>(
    name: string,
    schema: mongoose.Schema,
  ) => {
    return mongoose.model<any, T>(name, schema);
  };

  return fn(createSchema, registerModel, {
    mongoose,
    Schema,
    Types,
    //
    ObjectId: Types.ObjectId,
  });
}
