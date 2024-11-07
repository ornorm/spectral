import 'reflect-metadata';

/**
 * Type representing a class constructor.
 * @template T - The type of the class instance.
 */
export type Type<T = any> = {
    new (...args: Array<any>): T;
    readonly length: number;
    readonly name: string;
    prototype: T;
};

/**
 * Decorator to mark a class as an aspect.
 * @param target - The target class to be marked as an aspect.
 */
export function Aspect(target: Function): void {
    Reflect.defineMetadata('aspect', true, target);
}

/**
 * Annotation to specify the order of an aspect.
 * @param order - The order value.
 * @returns A class decorator to apply the order.
 */
export function Order(order: number): ClassDecorator {
    return function (target: Function): void {
        Reflect.defineMetadata('order', order, target);
    };
}
