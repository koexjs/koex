/**
 * Create instance of class, make method as middleware
 * 
 * @param Controller Controller Class
 */
function wrapController<T>(Controller: any): T {
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

// function wrapService<T>(Service: any): T {}