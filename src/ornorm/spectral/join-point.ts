/**
 * @file join-point.ts
*  @description This file contains the implementation for the Join Point
 * module in the Spectral framework.
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

import {Method, Type} from '@ornorm/spectral';

/**
 * Type representing a target for a join point.
 * It can be either a method or a type.
 * @see Method
 * @see Type
 */
export type JoinPointTarget<T = any> = Method<T> | Type<T>;

/**
 * Class representing a join point in the program execution.
 */
export class JoinPoint<T extends object = any> {
    public readonly privateArgs: Array<any>;
    public readonly privateMethod?: string;
    private readonly privateTarget: any;

    /**
     * Creates an instance of `JoinPoint`.
     * @param target The target object.
     * @param method The method name.
     * @param args The arguments passed to the method.
     * @see JoinPointTarget
     */
    constructor(target: any, method?: string, args?: Array<any>) {
        this.privateTarget = target;
        this.privateMethod = method;
        this.privateArgs = args || [];
    }

    /**
     * Gets the arguments passed to the method.
     * @returns The arguments.
     */
    public get args(): Array<any> {
        return this.privateArgs;
    }

    /**
     * Gets the target object.
     */
    public get scope(): any {
        return this.privateTarget;
    }

    /**
     * Gets the method associated with the join point.
     * @returns The method if it exists, otherwise undefined.
     */
    public get method(): Method<T> {
        return Reflect.get(this.privateTarget, this.privateMethod || '');
    }

    /**
     * Gets the method signature.
     * @returns The method signature.
     */
    public get signature(): string | undefined {
        return this.privateMethod;
    }

    /**
     * Gets the type of the target object.
     * @returns The constructor of the target object.
     */
    public get type(): Type<T> {
        return this.privateTarget.constructor;
    }

    /**
     * Returns a string representation of the join point.
     * @returns The string representation.
     */
    public toString(): string {
        if (this.signature === undefined) {
            return `${this.type.name} class`;
        }
        return `${this.method.name}.${this.signature}(${this.args.join(', ')})`;
    }
}
