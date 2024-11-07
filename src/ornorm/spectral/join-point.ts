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

/**
 * Class representing a join point in the program execution.
 */
export class JoinPoint {
    /**
     * Creates an instance of JoinPoint.
     * @param target - The target object.
     * @param method - The method name.
     * @param args - The arguments passed to the method.
     */
    constructor(
        public target: any,
        public method: string,
        public args: any[]) {
    }

    /**
     * Gets the arguments passed to the method.
     * @returns The arguments.
     */
    public getArgs(): Array<any> {
        return this.args;
    }

    /**
     * Gets the method signature.
     * @returns The method signature.
     */
    public getSignature(): string {
        return this.method;
    }

    /**
     * Gets the target object.
     * @returns The target object.
     */
    public getTarget(): any {
        return this.target.constructor;
    }

    /**
     * Gets the target object.
     * @returns The target object.
     */
    public getThis(): any {
        return this.target;
    }

    /**
     * Returns a string representation of the join point.
     * @returns The string representation.
     */
    public toString(): string {
        return `${this.getTarget().name}.${this.getSignature()}(${this.getArgs().join(', ')})`;
    }
}
