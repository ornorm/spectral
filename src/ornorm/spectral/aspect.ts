/**
 * @file aspect.ts
 * @description This file contains the implementation of advice decorators
 * for the Spectral framework.
 *
 * It includes decorators for defining aspects, ordering them, and applying
 * various types of advice such as before, after, around, etc.
 * @author Aimé Biendo <abiendo@gmail.com>
 * @version 0.0.1
 *
 * @license MIT
 *
 * (c) 2023 Spectral Software Inc. All rights reserved.
 *
 * This software is provided "as-is," without any express or implied warranty. In no event shall the authors be held liable for any damages arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose, including commercial applications, and to alter it and redistribute it freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not claim that you wrote the original software. If you use this software in a product, an acknowledgment in the product documentation would be appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

import 'reflect-metadata';

/**
 * Type alias representing a method.
 * A method is a function with a specific length and name.
 * @template T - The return type of the method.
 */
export type Method<T = any> = Function & {
    (...args: Array<any>): T;
    readonly length: number;
    readonly name: string;
};

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
 * @see Type
 */
export function Aspect<T = any>(target: Type<T>): void {
    Reflect.defineMetadata('aspect', true, target);
}

/**
 * Annotation to specify the order of an aspect.
 * @param order - The order value.
 * @returns A class decorator to apply the order.
 * @see ClassDecorator
 */
export function Order(order: number): ClassDecorator {
    return (target: any) =>
        Reflect.defineMetadata('order', order, target);
}
