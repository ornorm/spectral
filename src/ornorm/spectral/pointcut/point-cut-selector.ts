/**
 * @file point-cut-selector.ts
* @description This file contains the implementation of the PointcutSelector
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

import {
    JoinPointTarget, Method, PointcutHandler, Type
} from '@ornorm/spectral';

/**
 * Represents the possible target types for selectors.
 *
 * - `#`: The selector matches by ID.
 * - `&`: The selector matches by instance.
 * - `:`: The selector matches by type.
 * - `*`: The selector matches all targets.
 */
export type SelectorTarget = '#' | '&' | ':' | '*';

/**
 * Represents the possible selector types.
 *
 * - `class`: The selector is for a class.
 * - `method`: The selector is for a method.
 * - `parameters`: The selector is for parameters.
 */
export type SelectorType = 'class' | 'method' | 'parameters';

/**
 * Class representing a method matcher.
 *
 * Implements the MethodMatcher interface.
 * @see PointcutHandler
 */
export class PointcutSelector implements PointcutHandler {
    protected isStaticPointcut: boolean = false;
    protected readonly selector: string;
    protected target: SelectorTarget | null = null;
    protected type: SelectorType = 'method';

    /**
     * Constructs a new `PointcutSelector`.
     * @param expression The selector string used to match methods or classes.
     * @param isStaticPointcut Indicates if the expression is evaluated at runtime.
     */
    constructor(expression: string, isStaticPointcut: boolean = true) {
        this.selector = expression;
        this.isStaticPointcut = isStaticPointcut;
        this.determineSelectorTarget();
    }

    /**
     * Checks if the selector is for a class.
     */
    public get isClassSelector(): boolean {
        return this.type === 'class';
    }

    /**
     * Checks if the selector is for a method.
     */
    public get isMethodSelector(): boolean {
        return this.type === 'method';
    }

    /**
     * Indicates whether the expression is evaluated at runtime.
     */
    public get isRuntime(): boolean {
        return this.isStaticPointcut;
    }

    /**
     * Checks if the selector matches all targets.
     */
    public get isSelectingAll(): boolean {
        return this.selector === '*';
    }

    /**
     * Checks if the selector matches by instance.
     */
    public get isSelectingByInstance(): boolean {
        return this.selector.startsWith('&');
    }

    /**
     * Checks if the selector matches by type.
     */
    public get isSelectingByType(): boolean {
        return this.selector.startsWith(':');
    }

    /**
     * Checks if the selector matches by ID.
     */
    public get isSelectingById(): boolean {
        return this.selector.startsWith('#');
    }

    /**
     * @inheritDoc
     */
    public filter<T = any>(type: Type<T>): boolean {
        if (this.isRuntime) {
            if (this.isSelectingById) {
                return this.matchId(type);
            }
            if (this.isSelectingByType) {
                return this.matchType(type);
            }
            if (this.isSelectingByInstance) {
                return this.isAssignableFrom(type);
            }
            if (this.isSelectingAll) {
                return true;
            }
        }
        return this.matchPointcut(type);
    }

    /**
     * @inheritDoc
     */
    public matches<T extends object = any>(method: Method, type: Type<T>): boolean;

    /**
     * @inheritDoc
     */
    public matches<T extends object = any>(method: Method, type: Type<T>, args: Array<any>): boolean;

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
        if (this.isSelectingAll) {
            return true;
        }
        let matchMethod: boolean = false;
        let matchType: boolean = false;
        if (this.isRuntime) {
            // Runtime expression: consider method arguments
            if (args.length >= 2) {
                if (this.isSelectingById) {
                    matchType = this.matchId(type);
                } else if (this.isSelectingByType) {
                    matchType = this.matchType(type);
                } else if (this.isSelectingByInstance) {
                    matchType = this.isAssignableFrom(type);
                } else {
                    matchType = this.isDeclaredMethod(method, type);
                }
                matchMethod = this.matchPointcut(method);
            } else if (args.length === 1) {
                matchMethod = this.matchPointcut(method);
            }
        } else {
            // Static expression: do not consider method arguments
            matchMethod = this.matchPointcut(method);
        }
        // Check if the method arguments match the specified criteria
        if (args.length > 0) {
            matchMethod = matchMethod && this.matchArguments(method, args);
        }
        return matchType && matchMethod;
    }

    /**
     * Determines the token type based on the selector.
     * Sets the `SelectorTarget` property to one of the `SelectorTarget` values
     * (`#`, `&`, `:`, `*`) or `null` if no match is found.
     */
    protected determineSelectorTarget(): void {
        if (this.isSelectingById) {
            this.target = '#';
        } else if (this.isSelectingByInstance) {
            this.target = '&';
        } else if (this.isSelectingByType) {
            this.target = ':';
        } else if (this.isSelectingAll) {
            this.target = '*';
        }
    }

    /**
     * Checks if the type is assignable from the specified type.
     * @param type The class to check against the selector.
     * @returns True if the type is assignable from the specified type, otherwise false.
     */
    protected isAssignableFrom<T = any>(type: Type<T>): boolean {
        const specifiedType: string = this.selector.slice(1);
        const targetType: Type = Reflect.getMetadata('design:type', type);
        return targetType && targetType.prototype &&
            targetType.prototype.isPrototypeOf(specifiedType);
    }

    /**
     *  Check if this expression ever matches the given method on a target class.
     * @param method The method to check against the matcher criteria.
     * @param type The class to check against the method.
     * @returns True if the method matches the criteria, otherwise false.
     * @see Method
     * @see Type
     */
    protected isDeclaredMethod<T extends object = any>(
        method: Method, type: Type<T>
    ): boolean {
        let currentPrototype: any = type.prototype;
        while (currentPrototype) {
            if (Reflect.has(currentPrototype, method.name)) {
                return true;
            }
            currentPrototype = Object.getPrototypeOf(currentPrototype);
        }
        return false;
    }

    /**
     * Checks if the method arguments match the specified criteria.
     * @param method The method to check against the matcher criteria.
     * @param args The arguments to check against the method parameters.
     * @returns True if the arguments match the criteria, otherwise false.
     * @see Method
     */
    protected matchArguments(method: Method, args: Array<any>): boolean {
        const paramTypes: Array<any> = Reflect.getMetadata('design:paramtypes', method);
        if (!paramTypes || paramTypes.length !== args.length) {
            return false;
        }
        return args.every((arg: any, index: number): boolean => {
            const expectedType: any = paramTypes[index];
            return arg instanceof expectedType || typeof arg === expectedType.name.toLowerCase();
        });
    }

    /**
     * Checks if the selector matches the ID of the given type.
     * @param type The class to check against the selector.
     * @returns True if the selector matches the ID, otherwise false.
     * @see Type
     */
    protected matchId<T = any>(type: Type<T>): boolean {
        const id: string = this.selector.slice(1);
        return Reflect.hasMetadata('id', type) && Reflect.getMetadata('id', type) === id;
    }

    /**
     * The method selector matches methods or types based on the element
     * having a given attribute explicitly set, with options for defining an
     * attribute value or substring value match.
     *
     * @param joinPoint The method or type to check against the
     * matcher criteria.
     * @returns True if the method or type matches the criteria, otherwise
     * false.
     * @see JoinPointTarget
     */
    protected matchPointcut(joinPoint: JoinPointTarget): boolean {
        const regex: RegExp = /\[(\w+)([~|^$*]?=)?(".*?"|'.*?'|\w+)?([is]?)\]/;
        const match: RegExpMatchArray | null = this.selector.match(regex);
        if (!match) {
            return false;
        }
        const [, attr, operator, value, flag]: RegExpMatchArray = match;
        const attrValue: any = Reflect.getMetadata(attr, joinPoint);
        if (!attrValue) {
            return false;
        }
        const caseInsensitive: boolean = flag === 'i';
        const caseSensitive: boolean = flag === 's';
        // Determine if the attribute name and value should be case-insensitive
        const isHtmlAttribute: boolean = ['id', 'class', 'data-*', 'role', 'aria-*'].includes(attr.toLowerCase());
        const isCaseInsensitiveHtmlAttribute: boolean =
            !isHtmlAttribute && !caseSensitive && (caseInsensitive || attr.toLowerCase() === attr);
        switch (operator) {
            case '=':
                /*
                [attr=value]
                Represents methods with an attribute name of attr whose value is exactly value.
                 */
                return isCaseInsensitiveHtmlAttribute
                    ? joinPoint.name.toLowerCase() === attrValue.toLowerCase()
                    : joinPoint.name === attrValue;
            case '~=':
                /*
                [attr~=value]
                Represents methods with an attribute name of attr whose
                value is a whitespace-separated list of words, one of which is
                exactly value.
                 */
                return (
                    isCaseInsensitiveHtmlAttribute ? attrValue.toLowerCase() : attrValue
                ).split(' ').some((part: string): boolean => (
                    part === (
                        isCaseInsensitiveHtmlAttribute ? joinPoint.name.toLowerCase() : joinPoint.name
                    )
                ));
            case '|=':
                /*
                [attr|=value]
                Represents methods with an attribute name of attr whose value can be
                exactly value or can begin with value immediately followed by a dollar, \$
                (U+0024).
                */
                if (isCaseInsensitiveHtmlAttribute) {
                    if (joinPoint.name.toLowerCase() === attrValue.toLowerCase()) {
                        return true;
                    }
                    return joinPoint.name.toLowerCase().startsWith(attrValue.toLowerCase() + '$');
                }
                if (joinPoint.name === attrValue) {
                    return true;
                }
                return joinPoint.name.startsWith(attrValue + '$');
            case '^=':
                /*
                [attr^=value]
                Represents methods with an attribute name of attr whose value
                is prefixed (preceded) by value.
                 */
                return isCaseInsensitiveHtmlAttribute
                    ? joinPoint.name.toLowerCase().startsWith(attrValue.toLowerCase())
                    : joinPoint.name.startsWith(attrValue);
            case '$=':
                /*
                [attr$=value]
                Represents methods with an attribute name of attr whose value
                is suffixed (followed) by value.
                 */
                return isCaseInsensitiveHtmlAttribute
                    ? joinPoint.name.toLowerCase().endsWith(attrValue.toLowerCase())
                    : joinPoint.name.endsWith(attrValue);
            case '*=':
                /*
                [attr*=value]
                Represents methods with an attribute name of attr whose value
                contains at least one occurrence of value within the string.
                 */
                return isCaseInsensitiveHtmlAttribute
                    ? joinPoint.name.toLowerCase().includes(attrValue.toLowerCase())
                    : joinPoint.name.includes(attrValue);
            default:
                return !!attrValue;
        }
    }

    /**
     * The type selector matches classes by name.
     *
     * In other words, it selects all classes of the given type within a project.
     *
     * @param type The class to check against the selector.
     * @returns True if the class matches the selector, otherwise false.
     * @see Type
     */
    protected matchType<T = any>(type: Type<T>): boolean {
        const selector: string = this.selector;
        const namespaceRegex = /^(\w+|\*)\|(\w+)$/;
        const noNamespaceRegex = /^\|(\w+)$/;
        const namespaceMatch: RegExpMatchArray | null = selector.match(namespaceRegex);
        const noNamespaceMatch: RegExpMatchArray | null = selector.match(noNamespaceRegex);
        if (namespaceMatch) {
            const [_, namespace, typeName] = namespaceMatch;
            const typeNamespace: any = Reflect.getMetadata('namespace', type);
            if ((namespace === '*' || namespace === typeNamespace) && typeName === type.name) {
                return true;
            }
        } else if (noNamespaceMatch) {
            const [_, typeName] = noNamespaceMatch;
            if (typeName === type.name) {
                return true;
            }
        }

        return false;
    }
}
