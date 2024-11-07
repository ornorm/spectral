/**
 * @file regexp-method-pointcut.ts
 * @description This file contains the implementation of the RegexpMethodPointcut
 * class for the Spectral framework.
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

import { Method, MethodMatcher, Type } from '@ornorm/spectral';

/**
 * Class representing a static pointcut using regular expressions.
 * @see MethodMatcher
 */
export class RegexpMethodPointcut implements MethodMatcher {
    private readonly patterns: Array<RegExp>;

    /**
     * Creates an instance of `RegexpMethodPointcut`.
     * @param patterns An array of string patterns to be converted to
     * regular expressions.
     */
    constructor(patterns: Array<string>) {
        this.patterns = patterns.map((
            pattern: string): RegExp => new RegExp(pattern));
    }

    /**
     * Indicates whether the method matcher is evaluated at runtime.
     */
    public get isRuntime(): boolean {
        return false;
    }

        /**
         * Determines if the given method matches the criteria defined by the
         * matcher, with additional runtime arguments.
         * @param method The method to check against the matcher criteria.
         * @param type The class of the target object.
         * @param args Additional runtime arguments.
         * @returns True if the method matches the criteria, otherwise false.
         */
    public matches<T extends object = any>(
        method: Method, type: Type<T>, ...args: Array<any>
    ): boolean {
        if (this.patterns.findIndex(
            (pattern: RegExp): boolean => pattern.source === '*'
        ) !== -1) {
            return true;
        }
        let matchMethod: boolean = false;
        let matchType: boolean = false;
        if (this.isRuntime) {
            // Runtime pointcut: consider method arguments
            if (args.length >= 2) {
                for (const reg of this.patterns) {
                    const match: RegExpExecArray | null = reg.exec(method.name);
                    if (match) {
                        if (match.groups?.id) {
                            // Implement logic for matching by ID
                            matchType = Reflect.hasMetadata('id', type) &&
                                Reflect.getMetadata('id', type) === match.groups.id;
                        } else if (match.groups?.type) {
                            // Implement logic for matching by type
                            matchType = type.name === match.groups.type;
                        } else if (match.groups?.instance) {
                            // Implement logic for matching by instance
                            const targetType: Type = Reflect.getMetadata('design:type', type);
                            matchType = targetType && targetType.prototype &&
                                targetType.prototype.isPrototypeOf(match.groups.instance);
                        } else {
                            // Default logic: check if the method is in the matcher list
                            // associated with the type
                            const matcherList: Array<string> = Reflect.getMetadata('matcherList', type) || [];
                            matchType = matcherList.includes(method.name);
                        }
                        if (matchType) {
                            matchMethod = true;
                            break;
                        }
                    }
                }
            } else if (args.length === 1) {
                matchMethod = this.patterns.some((pattern: RegExp): boolean =>
                    pattern.test(method.name));
            }
        } else {
            // Static pointcut: do not consider method arguments
            matchMethod = this.patterns.some((pattern: RegExp): boolean =>
                pattern.test(method.name));
        }
        // Check if the method arguments match the specified criteria
        if (args.length > 0) {
            const paramNames: Array<string> =
                Reflect.getMetadata('design:paramnames', method) || [];
            matchMethod = matchMethod &&
                args.every((arg: any, index: number) =>
                    paramNames[index] === arg.name
                );
        }
        return matchType && matchMethod;
    }
}
