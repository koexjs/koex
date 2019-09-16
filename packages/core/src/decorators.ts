import { router } from './router';

export type Method<D> = (...args: any[]) => D;

export type Decorator<T> = (target: T, propertyName: keyof T, descriptor: TypedPropertyDescriptor<Method<any>>) => TypedPropertyDescriptor<Method<any>>;

export function Get<T>(path: string): Decorator<any> {
  return (target: T, propertyName, descriptor) => {
    if (descriptor.value != null) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        
      }

      return descriptor;
    }
  }
}