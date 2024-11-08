/**
 * @file advice.ts
 * @description This file contains the implementation of advice decorators
 * for the Spectral framework.
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
    ClassFilter,
    getParameterNames,
    isClassFilter,
    isMethodMatcher,
    JoinPoint,
    Method,
    MethodMatcher, Type
} from '@ornorm/spectral';

/**
 * The type of advice that can be applied.
 * - \`before\`: Advice to be executed before the join point.
 * - \`after\`: Advice to be executed after the join point.
 * - \`afterReturning\`: Advice to be executed after the join point if it returns successfully.
 * - \`afterThrowing\`: Advice to be executed after the join point if it throws an exception.
 * - \`around\`: Advice to be executed around the join point, allowing to control when the join point is executed.
 */
export type AdviceType = 'before' | 'after' | 'afterReturning' | 'afterThrowing' | 'around';

/**
 * Type representing an advice, which can be a function or a method.
 * @see Method
 */
export type Advice = Function | Method;

/**
 * Class representing an advisor that applies advice to join points.
 */
export class Advisor {
    private readonly privateAdvice: Advice;
    private readonly privatePointcut: ClassFilter | MethodMatcher;
    private matchJoinPoint: boolean = false;

    /**
     * Creates an instance of Advisor.
     * @param advice - The advice function or method to be applied.
     * @param pointcut - The pointcut expression defining where the advice
     * should be applied.
     * @see Advice
     * @see ClassFilter
     * @see MethodMatcher
     */
    constructor(advice: Advice, pointcut: ClassFilter | MethodMatcher) {
        this.privateAdvice = advice;
        this.privatePointcut = pointcut;
    }

    /**
     * Gets the advice.
     * @see Advice.
     */
    public get advice(): Advice {
        return this.privateAdvice;
    }

    public get executed(): boolean {
        return this.matchJoinPoint;
    }

    public set executed(value: boolean) {
        this.matchJoinPoint = value;
    }

    /**
     * Checks if the advice is applied to a class.
     * @returns True if the advice is applied to a class, false otherwise.
     */
    public get isClassAdvice(): boolean {
        return isClassFilter(this.pointcut);
    }

    /**
     * Checks if the advice is applied to a method.
     */
    public get isMethodAdvice(): boolean {
        return isMethodMatcher(this.pointcut);
    }

    /**
     * Gets the pointcut expression.
     * @returns The pointcut expression which can be a `ClassFilter` or
     * `MethodMatcher`.
     * @see ClassFilter
     * @see MethodMatcher
     */
    public get pointcut(): ClassFilter | MethodMatcher {
        return this.privatePointcut;
    }

    /**
     * Executes the advice logic at the join point.
     * @param joinPoint - The join point where the advice should be applied.
     * @param args - The arguments to be passed to the advice method.
     * @returns The result of the advice execution.
     * @see JoinPoint
     */
    public execute<T extends object = any>(
        joinPoint: JoinPoint<T>, ...args: Array<any>
    ): any {
        this.executed = false;
        if (
            isClassFilter(this.pointcut) &&
            this.pointcut.filter(joinPoint.type)
        ) {
            this.executed = true;
            return this.advice.call(joinPoint.scope, ...args);
        } else if (
            isMethodMatcher(this.pointcut) &&
            this.pointcut.matches(joinPoint.method, joinPoint.type, joinPoint.args)
        ) {
            this.executed = true;
            return this.advice.call(joinPoint.scope, ...args);
        }
        return undefined;
    }
}

/**
 * Retrieves the matching advisor for a given target, method, and type.
 * @param target - The target object.
 * @param method - The method to match.
 * @param type - The type of the target object.
 * @returns The matching Advisor if found, otherwise undefined.
 * @see Method
 * @see Type
 */
export function getMatchingAdvisor<T extends object = any>(
    target: any, method: Method, type: Type<T>
): Advisor | undefined {
    const advisors: Array<Advisor> =
        Reflect.getMetadata('advisors', target.constructor) || [];
    for (const advisor of advisors) {
        if (advisor.isMethodAdvice) {
            const matcher: MethodMatcher = advisor.pointcut as MethodMatcher;
            if (matcher.matches(method, type)) {
                return advisor;
            }
        }
        if (advisor.isClassAdvice) {
            const filter: ClassFilter = advisor.pointcut as ClassFilter;
            if (filter.filter(type)) {
                return advisor;
            }
        }
    }
    return undefined
}

/**
 * Decorator to define a before advice.
 * @param pointcut - The pointcut expression.
 * @returns A method decorator to apply the before advice.
 * @see MethodDecorator
 */
export function Before(pointcut: string, argNames?: string): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
        const originalMethod: Method = descriptor.value;
        descriptor.value = function (...args: Array<any>): any {
            const joinPoint: JoinPoint = new JoinPoint(this, propertyKey.toString(), args);
            const beforeAdvices: Array<{
                pointcut: string,
                method: Function
            }> = Reflect.getMetadata('before', target.constructor) || [];
            beforeAdvices.forEach((advice: { pointcut: string, method: Function }) => {
                if (advice.pointcut === pointcut) {
                    const paramNames: Array<string> = argNames ?
                        argNames.split(',') :
                        getParameterNames(target.constructor, propertyKey as string);
                    const adviceArgs: Array<string> = paramNames.map((name: string) => {
                        if (name === 'joinPoint') {
                            return joinPoint;
                        }
                        return args[paramNames.indexOf(name)];
                    });
                    advice.method.apply(this, adviceArgs);
                }
            });
            let result: any = undefined;
            const advisor: Advisor | undefined =
                getMatchingAdvisor(this, originalMethod, this.constructor as Type);
            if (advisor) {
                result = advisor.execute(joinPoint, ...args);
            }
            if (advisor && advisor.executed) {
                return result;
            }
            return originalMethod.apply(this, args);
        };
        const existingBeforeAdvices: Array<{
            pointcut: string,
            method: Function
        }> = Reflect.getMetadata('before', target.constructor) || [];
        existingBeforeAdvices.push({pointcut, method: (target as any)[propertyKey as string]});
        Reflect.defineMetadata('before', existingBeforeAdvices, target.constructor);
    };
}

/**
 * Decorator to define an after returning advice.
 * @param pointcut - The pointcut expression.
 * @param argNames - The argument names.
 * @returns A method decorator to apply the after returning advice.
 * @see MethodDecorator
 */
export function AfterReturning(pointcut: string, argNames?: string): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
        const originalMethod: Method = descriptor.value;
        descriptor.value = function (...args: Array<any>): any {
            const joinPoint: JoinPoint = new JoinPoint(this, propertyKey.toString(), args);
            const advisor: Advisor | undefined =
                getMatchingAdvisor(this, originalMethod, this.constructor as Type);
            const result: any = originalMethod.apply(this, args);
            const afterReturningAdvices: Array<{
                pointcut: string,
                method: Function
            }> = Reflect.getMetadata('afterReturning', target.constructor) || [];
            afterReturningAdvices.forEach((advice: { pointcut: string, method: Function }) => {
                if (advice.pointcut === pointcut) {
                    const paramNames: Array<string> = argNames ?
                        argNames.split(',') :
                        getParameterNames(target.constructor, propertyKey as string);
                    const adviceArgs: Array<any> = paramNames.map((name: string) => {
                        if (name === 'joinPoint') {
                            return joinPoint;
                        }
                        if (name === 'result') {
                            return result;
                        }
                        return args[paramNames.indexOf(name)];
                    });
                    advice.method.apply(this, adviceArgs);
                }
            });
            if (advisor) {
                advisor.execute(joinPoint, ...args);
            }
            return result;
        };
        const existingAfterReturningAdvices: Array<{
            pointcut: string,
            method: Function
        }> = Reflect.getMetadata('afterReturning', target.constructor) || [];
        existingAfterReturningAdvices.push({pointcut, method: (target as any)[propertyKey.toString()]});
        Reflect.defineMetadata('afterReturning', existingAfterReturningAdvices, target.constructor);
    };
}

/**
 * Decorator to define an after throwing advice.
 * @param pointcut - The pointcut expression.
 * @param argNames - The argument names.
 * @returns A method decorator to apply the after throwing advice.
 * @see MethodDecorator
 */
export function AfterThrowing(pointcut: string, argNames?: string): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
        const originalMethod: Method = descriptor.value;
        descriptor.value = function (...args: Array<any>): any {
            try {
                return originalMethod.apply(this, args);
            } catch (error: any) {
                const joinPoint: JoinPoint = new JoinPoint(this, propertyKey as string, args);
                const advisor: Advisor | undefined = getMatchingAdvisor(this, originalMethod, this.constructor as Type);
                const afterThrowingAdvices: Array<{
                    pointcut: string,
                    method: Function
                }> = Reflect.getMetadata('afterThrowing', target.constructor) || [];
                afterThrowingAdvices.forEach((advice: { pointcut: string, method: Function }) => {
                    if (advice.pointcut === pointcut) {
                        const paramNames: Array<string> =
                            argNames ? argNames.split(',') :
                                getParameterNames(target.constructor, propertyKey as string);
                        const adviceArgs: Array<any> = paramNames.map(name => {
                            if (name === 'joinPoint') return joinPoint;
                            if (name === 'error') return error;
                            return args[paramNames.indexOf(name)];
                        });
                        advice.method.apply(this, adviceArgs);
                    }
                });
                if (advisor) {
                    advisor.execute(joinPoint, ...args);
                }
                throw error;
            }
        };
        const existingAfterThrowingAdvices: Array<{
            pointcut: string,
            method: Function
        }> = Reflect.getMetadata('afterThrowing', target.constructor) || [];
        existingAfterThrowingAdvices.push({pointcut, method: (target as any)[propertyKey as string]});
        Reflect.defineMetadata('afterThrowing', existingAfterThrowingAdvices, target.constructor);
    };
}

/**
 * Decorator to define an after (finally) advice.
 * @param pointcut - The pointcut expression.
 * @param argNames - The argument names.
 * @returns A method decorator to apply the after (finally) advice.
 * @see MethodDecorator
 */
export function After(pointcut: string, argNames?: string): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
        const originalMethod: Method = descriptor.value;
        descriptor.value = function (...args: Array<any>): any {
            const joinPoint: JoinPoint = new JoinPoint(this, propertyKey as string, args);
            const advisor: Advisor | undefined = getMatchingAdvisor(this, originalMethod, this.constructor as Type);
            const afterAdvices: Array<{
                pointcut: string,
                method: Function
            }> = Reflect.getMetadata('after', target.constructor) || [];
            try {
                return originalMethod.apply(this, args);
            } finally {
                afterAdvices.forEach((advice: { pointcut: string, method: Function }) => {
                    if (advice.pointcut === pointcut) {
                        const paramNames: Array<string> = argNames ? argNames.split(',') : getParameterNames(target.constructor, propertyKey as string);
                        const adviceArgs: Array<any> = paramNames.map(name => {
                            if (name === 'joinPoint') return joinPoint;
                            return args[paramNames.indexOf(name)];
                        });
                        advice.method.apply(this, adviceArgs);
                    }
                });
                if (advisor) {
                    advisor.execute(joinPoint, ...args);
                }
            }
        };
        const existingAfterAdvices: Array<{
            pointcut: string,
            method: Function
        }> = Reflect.getMetadata('after', target.constructor) || [];
        existingAfterAdvices.push({pointcut, method: (target as any)[propertyKey as string]});
        Reflect.defineMetadata('after', existingAfterAdvices, target.constructor);
    };
}

/**
 * Decorator to define an around advice.
 * @param pointcut - The pointcut expression.
 * @param argNames - The argument names.
 * @returns A method decorator to apply the around advice.
 * @see MethodDecorator
 */
export function Around(pointcut: string, argNames?: string): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
        const originalMethod: Method = descriptor.value;
        descriptor.value = function (...args: Array<any>): any {
            const joinPoint: JoinPoint = new JoinPoint(this, propertyKey as string, args);
            const advisor: Advisor | undefined = getMatchingAdvisor(this, originalMethod, this.constructor as Type);
            const aroundAdvices: Array<{
                pointcut: string,
                method: Function
            }> = Reflect.getMetadata('around', target.constructor) || [];
            let result: any;
            aroundAdvices.forEach((advice: { pointcut: string, method: Function }) => {
                if (advice.pointcut === pointcut) {
                    const paramNames: Array<string> = argNames ? argNames.split(',') : getParameterNames(target.constructor, propertyKey as string);
                    const adviceArgs: Array<any> = paramNames.map((name: string) => {
                        if (name === 'joinPoint') {
                            return joinPoint;
                        }
                        return args[paramNames.indexOf(name)];
                    });
                    result = advice.method.apply(this, adviceArgs.concat(() =>
                        originalMethod.apply(this, args)));
                }
            });
            if (advisor) {
                advisor.execute(joinPoint, ...args);
            }
            return result;
        };
        const existingAroundAdvices: Array<{
            pointcut: string,
            method: Function
        }> = Reflect.getMetadata('around', target.constructor) || [];
        existingAroundAdvices.push({pointcut, method: (target as any)[propertyKey as string]});
        Reflect.defineMetadata('around', existingAroundAdvices, target.constructor);
    };
}
