/**
 * @file point-cut.ts
 * @description This file contains the implementation of pointcut
 * expressions and matchers for the Spectral framework.
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
 * Type alias for a function that validates whether a given target matches
 * a pointcut expression.
 *
 * @param target The target to validate against the pointcut expression.
 * @returns Returns true if the target matches the pointcut expression,
 * otherwise false.
 */
export type MatchPointcut = (target: any) => boolean;

/**
 * The ClassFilter interface is used to restrict the pointcut to a given set
 * of target classes.
 *
 * If the matches method always returns true, all target classes are
 * matched.
 */
export interface ClassFilter {
    /**
     * Determines if the given class matches the criteria defined by the filter.
     * @param type The class to check against the filter criteria.
     * @returns True if the class matches the criteria, otherwise false.
     * @see Type
     */
    filter<T = any>(type: Type<T>): boolean;
}

/**
 * The MethodMatcher interface is used to restrict the pointcut to a given
 * set of target methods.
 *
 * If the matches method always returns true, all target methods are
 * matched.
 */
export interface MethodMatcher {
    /**
     * Indicates whether the method matcher is evaluated at runtime.
     */
    readonly isRuntime: boolean;

    /**
     * Determines if the given method matches the criteria defined by the
     * matcher.
     * @param method The method to check against the matcher criteria.
     * @param type The class of the target object.
     * @returns True if the method matches the criteria, otherwise false.
     * @see Method
     * @see Type
     */
    matches<T = any>(method: Method, type: Type<T>): boolean;

    /**
     * Determines if the given method matches the criteria defined by the
     * matcher, with additional runtime arguments.
     * @param method The method to check against the matcher criteria.
     * @param type The class of the target object.
     * @param args Additional runtime arguments.
     * @returns True if the method matches the criteria, otherwise false.
     * @see Method
     * @see Type
     */
    matches<T = any>(method: Method, type: Type<T>, args: Array<any>): boolean;
}

/**
 * Pointcut model enables pointcut reuse independent of advice types.
 *
 * You can target different advice with the same pointcut.
 *
 * The pointcut interface is the central interface, used to target advice
 * to particular classes and methods.
 */
export interface PointcutModel {
    /**
     * The class filter used to restrict the pointcut to a given set of target
     * classes.
     * @see ClassFilter
     */
    classFilter?: ClassFilter;
    /**
     * The method matcher used to restrict the pointcut to a given set of
     * target methods.
     * @see MethodMatcher
     */
    methodMatcher?: MethodMatcher;
}

export type TokenType = '#' | '&' | ':' | '*';
export type SelectorType = 'method' | 'class';

/**
 * Class representing a method matcher.
 *
 * Implements the MethodMatcher interface.
 * @see MethodMatcher
 */
export class PointcutSelector implements ClassFilter, MethodMatcher {
    protected isStaticPointcut: boolean = false;
    protected readonly selector: string;
    protected tokenType: TokenType | null = null;
    protected type: SelectorType = 'method';

    constructor(selector: string, isStaticPointcut: boolean = false) {
        this.selector = selector;
        this.isStaticPointcut = isStaticPointcut;
        this.determineTokenType();
    }

    /**
     * Checks if the selector is for a class.
     * @returns {boolean} True if the selector is for a class, otherwise false.
     */
    public get isClassSelector(): boolean {
        return this.type === 'class';
    }

    /**
     * Checks if the selector is for a method.
     * @returns {boolean} True if the selector is for a method, otherwise false.
     */
    public get isMethodSelector(): boolean {
        return this.type === 'method';
    }

    /**
     * Indicates whether the pointcut is evaluated at runtime.
     * @returns  True if the pointcut is evaluated at runtime, otherwise false.
     */
    public get isRuntime(): boolean {
        return this.isStaticPointcut;
    }

    /**
     * Checks if the selector matches all targets.
     * @returns  True if the selector matches all targets, otherwise false.
     */
    public get isSelectingAll(): boolean {
        return this.selector === '*';
    }

    /**
     * Checks if the selector matches by instance.
     * @returns  True if the selector matches by instance, otherwise false.
     */
    public get isSelectingByInstance(): boolean {
        return this.selector.startsWith('&');
    }

    /**
     * Checks if the selector matches by type.
     * @returns  True if the selector matches by type, otherwise false.
     */
    public get isSelectingByType(): boolean {
        return this.selector.startsWith(':');
    }

    /**
     * Checks if the selector matches by ID.
     * @returns  True if the selector matches by ID, otherwise false.
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
     * @param targetClass The class of the target object.
     * @param args Additional runtime arguments.
     * @returns True if the method matches the criteria, otherwise false.
     */
    public matches<T extends object = any>(
        method: Method,
        type: Type<T>,
        ...args: Array<any>
    ): boolean {
        if (this.isSelectingAll) {
            return true;
        }
        let machType: boolean = false;
        let machMethod: boolean = false;
        if (this.isRuntime) {
            // Runtime pointcut: consider method arguments
            if (args.length >= 2) {
                if (this.isSelectingById) {
                    machType = this.matchId(type);
                } else if (this.isSelectingByType) {
                    machType = this.matchType(type);
                } else if (this.isSelectingByInstance) {
                    machType = this.isAssignableFrom(type);
                } else {
                    machType = this.isDeclaredMethod(method, type);
                }
                machMethod = this.matchPointcut(method);
            } else if (args.length === 1) {
                machMethod = this.matchPointcut(method);
            }
        } else {
            // Static pointcut: do not consider method arguments
            machMethod = this.matchPointcut(method);
        }
        return machType && machMethod;
    }

    /**
     * Determines the token type based on the selector.
     * Sets the `tokenType` property to one of the `TokenType` values
     * (`#`, `&`, `:`, `*`) or `null` if no match is found.
     */
    protected determineTokenType(): void {
        if (this.isSelectingById) {
            this.tokenType = '#';
        } else if (this.isSelectingByInstance) {
            this.tokenType = '&';
        } else if (this.isSelectingByType) {
            this.tokenType = ':';
        } else if (this.isSelectingAll) {
            this.tokenType = '*';
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
        return targetType && targetType.prototype && targetType.prototype.isPrototypeOf(specifiedType);
    }

    /**
     *  Check if this pointcut ever matches the given method on a target class.
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
     * @param methodOrType The method or type to check against the
     * matcher criteria.
     * @returns True if the method or type matches the criteria, otherwise
     * false.
     * @see Method
     * @see Type
     */
    protected matchPointcut(methodOrType: Method | Type): boolean {
        const regex: RegExp = /\[(\w+)([~|^$*]?=)?(".*?"|'.*?'|\w+)?([is]?)\]/;
        const match: RegExpMatchArray | null = this.selector.match(regex);
        if (!match) {
            return false;
        }
        const [, attr, operator, value, flag]: RegExpMatchArray = match;
        const attrValue: any = Reflect.getMetadata(attr, methodOrType);
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
                    ? methodOrType.name.toLowerCase() === attrValue.toLowerCase()
                    : methodOrType.name === attrValue;
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
                        isCaseInsensitiveHtmlAttribute ? methodOrType.name.toLowerCase() : methodOrType.name
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
                    if (methodOrType.name.toLowerCase() === attrValue.toLowerCase()) {
                        return true;
                    }
                    return methodOrType.name.toLowerCase().startsWith(attrValue.toLowerCase() + '$');
                }
                if (methodOrType.name === attrValue) {
                    return true;
                }
                return methodOrType.name.startsWith(attrValue + '$');
            case '^=':
                /*
                [attr^=value]
                Represents methods with an attribute name of attr whose value
                is prefixed (preceded) by value.
                 */
                return isCaseInsensitiveHtmlAttribute
                    ? methodOrType.name.toLowerCase().startsWith(attrValue.toLowerCase())
                    : methodOrType.name.startsWith(attrValue);
            case '$=':
                /*
                [attr$=value]
                Represents methods with an attribute name of attr whose value
                is suffixed (followed) by value.
                 */
                return isCaseInsensitiveHtmlAttribute
                    ? methodOrType.name.toLowerCase().endsWith(attrValue.toLowerCase())
                    : methodOrType.name.endsWith(attrValue);
            case '*=':
                /*
                [attr*=value]
                Represents methods with an attribute name of attr whose value
                contains at least one occurrence of value within the string.
                 */
                return isCaseInsensitiveHtmlAttribute
                    ? methodOrType.name.toLowerCase().includes(attrValue.toLowerCase())
                    : methodOrType.name.includes(attrValue);
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

/**
 * **\@Pointcut**
 *
 *
 * Decorator to define a pointcut.
 * @param expression The pointcut expression.
 * @returns A function to define the pointcut metadata.
 * @see MethodDecorator
 */
export function Pointcut(expression: string): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
        Reflect.defineMetadata('pointcut', expression, target, propertyKey);
    };
}

/**
 * Class responsible for parsing and evaluating pointcut expressions.
 */
export class PointcutExpressionParser {
    private static pointcutMethods: Map<string, MatchPointcut> =
        new Map<string, MatchPointcut>();

    /**
     * Retrieves a registered pointcut method by its name.
     * @param name The name of the pointcut.
     * @returns The pointcut method if found, otherwise undefined.
     * @see MatchPointcut
     */
    public static getPointcut(name: string): MatchPointcut | undefined {
        return this.pointcutMethods.get(name);
    }

    /**
     * Deletes a registered pointcut method by its name.
     * @param name The name of the pointcut to delete.
     */
    public static deletePointcut(name: string): void {
        this.pointcutMethods.delete(name);
    }

    /**
     * Checks if a pointcut with the given name is registered.
     * @param name The name of the pointcut.
     * @returns True if the pointcut is registered, otherwise false.
     */
    public static hasPointcut(name: string): boolean {
        return this.pointcutMethods.has(name);
    }

    /**
     * Parses a pointcut expression.
     * @param expression The pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    public static parse(expression: string): MatchPointcut {
        const tokens: Array<string> = expression.split(/\s+/);
        const stack: Array<MatchPointcut | string> = [];
        tokens.forEach((token: string): void => {
            if (token === '&&' || token === '||' || token === '!') {
                stack.push(token);
            } else if (this.pointcutMethods.has(token)) {
                stack.push(this.pointcutMethods.get(token)!);
            } else if (token.startsWith('execution(')) {
                stack.push(this.parseExecution(token));
            } else if (token.startsWith('within(')) {
                stack.push(this.parseWithin(token));
            } else if (token.startsWith('this(')) {
                stack.push(this.parseThis(token));
            } else if (token.startsWith('target(')) {
                stack.push(this.parseTarget(token));
            } else if (token.startsWith('args(')) {
                stack.push(this.parseArgs(token));
            } else if (token.startsWith('@target(')) {
                stack.push(this.parseAtTarget(token));
            } else if (token.startsWith('@within(')) {
                stack.push(this.parseAtWithin(token));
            } else if (token.startsWith('@annotation(')) {
                stack.push(this.parseAtAnnotation(token));
            } else if (token.startsWith('@args(')) {
                stack.push(this.parseAtArgs(token));
            } else if (token.startsWith('bean(')) {
                stack.push(this.parseBean(token));
            } else {
                throw new SyntaxError(`Unknown pointcut expression: ${token}`);
            }
        });
        return this.evaluate(stack);
    }

    /**
     * Registers a pointcut method.
     * @param name The name of the pointcut.
     * @param method The method to register.
     * @see MatchPointcut
     */
    public static setPointcut(name: string, method: MatchPointcut): void {
        this.pointcutMethods.set(name, method);
    }

    /**
     * Evaluates the parsed pointcut expression stack.
     * @param stack The stack of parsed pointcut expressions.
     * @returns A `MatchPointcut` representing the evaluated pointcut.
     * @see MatchPointcut
     */
    private static evaluate(stack: Array<MatchPointcut | string>): MatchPointcut {
        const operators: Array<string> = [];
        const operands: Array<MatchPointcut> = [];
        while (stack.length > 0) {
            const token: MatchPointcut | string | undefined = stack.shift();
            if (typeof token === 'string') {
                operators.push(token);
            } else {
                operands.push(token as MatchPointcut);
            }
            if (operators.length > 0 && operands.length >= 2) {
                const operator: string | undefined = operators.pop();
                const right: Function | undefined = operands.pop();
                const left: Function | undefined = operands.pop();
                if (operator === '&&') {
                    operands.push((...args: any[]): boolean => (left!(...args) && right!(...args)));
                } else if (operator === '||') {
                    operands.push((...args: any[]): boolean => (left!(...args) || right!(...args)));
                }
            }
        }
        return operands[0];
    }

    /**
     * Parses an `@annotation` pointcut expression.
     * @param token The `@annotation` pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed `@annotation`
     * pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseAtAnnotation(token: string): MatchPointcut {
        const regex: RegExp = /@annotation\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new Error(`Invalid @annotation expression: ${token}`);
        }
        const expression: string = match[1];
        return (method: Function): boolean => {
            return Reflect.hasMetadata(expression, method);
        };
    }

    /**
     * Parses an `args` pointcut expression.
     * @param token The `args` pointcut expression to parse.
     * @returns A function representing the parsed `args` pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseArgs(token: string): MatchPointcut {
        const regex: RegExp = /args\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new SyntaxError(`Invalid args expression: ${token}`);
        }
        const expression: Array<string> = match[1].split(',').map((arg: string): string => arg.trim());
        return (...args: any[]): boolean => {
            if (args.length !== expression.length) {
                return false;
            }
            return args.every((arg: any, index: number): boolean => {
                const argType: string = typeof arg;
                return argType === expression[index] || expression[index] === '*';
            });
        };
    }

    /**
     * Parses a `@args` pointcut expression.
     * @param token The `@args` pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed `@args` pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseAtArgs(token: string): MatchPointcut {
        const regex: RegExp = /@args\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new Error(`Invalid @args expression: ${token}`);
        }
        const expression: Array<string> = match[1].split(',').map((arg: string): string => arg.trim());
        return (...args: any[]): boolean => {
            if (args.length !== expression.length) {
                return false;
            }
            return args.every((arg: any, index: number): boolean => {
                return Reflect.hasMetadata(expression[index], arg);
            });
        };
    }

    /**
     * Parses a `@target` pointcut expression.
     * @param token The `@target` pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed `@target`
     * pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseAtTarget(token: string): MatchPointcut {
        const regex: RegExp = /@target\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new SyntaxError(`Invalid @target expression: ${token}`);
        }
        const expression: string = match[1];
        return (target: any): boolean => {
            return Reflect.hasMetadata(expression, target);
        };
    }

    /**
     * Parses an `@within` pointcut expression.
     * @param token The `@within` pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed `@within` pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseAtWithin(token: string): MatchPointcut {
        const regex: RegExp = /@within\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new SyntaxError(`Invalid @within expression: ${token}`);
        }
        const expression: string = match[1];
        return (target: any): boolean => {
            return Reflect.hasMetadata(expression, target.constructor);
        };
    }

    /**
     * Parses a `bean` pointcut expression.
     * @param token The `bean` pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed `bean` pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseBean(token: string): MatchPointcut {
        const regex: RegExp = /bean\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new SyntaxError(`Invalid bean expression: ${token}`);
        }
        const expression: string = match[1];
        return (beanName: string): boolean => {
            return beanName === expression;
        };
    }

    /**
     * Parses an `execution` pointcut expression.
     * @param token The `execution` pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed `execution`
     * pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseExecution(token: string): MatchPointcut {
        const regex: RegExp = /execution\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new SyntaxError(`Invalid execution expression: ${token}`);
        }
        const expression: string = match[1];
        return (method: Function): boolean => {
            const methodString: string = method.toString();
            const methodRegex: RegExp = new RegExp(expression.replace(/\*/g, '.*').replace(/\.\./g, '.*'));
            return methodRegex.test(methodString);
        };
    }

    /**
     * Parses a `target` pointcut expression.
     * @param token The `target` pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed `target` pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseTarget(token: string): MatchPointcut {
        const regex: RegExp = /target\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new SyntaxError(`Invalid target expression: ${token}`);
        }
        const expression: string = match[1];
        return (target: any): boolean => {
            return target.constructor.name === expression;
        };
    }

    /**
     * Parses a `this` pointcut expression.
     * @param token The `this` pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed `this` pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseThis(token: string): MatchPointcut {
        const regex: RegExp = /this\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new SyntaxError(`Invalid this expression: ${token}`);
        }
        const expression: string = match[1];
        return (proxy: any): boolean => {
            return proxy.constructor.name === expression;
        };
    }

    /**
     * Parses a `within` pointcut expression.
     * @param token The `within` pointcut expression to parse.
     * @returns A `MatchPointcut` representing the parsed `within` pointcut.
     * @throws SyntaxError if the expression is invalid.
     * @see MatchPointcut
     */
    private static parseWithin(token: string): MatchPointcut {
        const regex: RegExp = /within\((.*?)\)/;
        const match: RegExpMatchArray | null = token.match(regex);
        if (!match) {
            throw new SyntaxError(`Invalid within expression: ${token}`);
        }
        const expression: string = match[1];
        return (target: any): boolean => {
            const targetString: string = target.constructor.name;
            const withinRegex: RegExp = new RegExp(expression.replace(/\*/g, '.*').replace(/\.\./g, '.*'));
            return withinRegex.test(targetString);
        };
    }
}
