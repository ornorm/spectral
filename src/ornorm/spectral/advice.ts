import {getParameterNames, JoinPoint} from '@spectral';

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
 * Decorator to define a before advice.
 * @param pointcut - The pointcut expression.
 * @returns A method decorator to apply the before advice.
 * @see MethodDecorator
 */
export function Before(pointcut: string, argNames?: string): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): void {
        const originalMethod: Function = descriptor.value;
        descriptor.value = function (...args: any[]): any {
            const joinPoint: JoinPoint = new JoinPoint(this, propertyKey as string, args);
            const beforeAdvices: Array<{
                pointcut: string,
                method: Function
            }> = Reflect.getMetadata('before', target.constructor) || [];
            beforeAdvices.forEach((advice: { pointcut: string, method: Function }) => {
                if (advice.pointcut === pointcut) {
                    const paramNames: Array<string> = argNames ? argNames.split(',') : getParameterNames(target.constructor, propertyKey as string);
                    const adviceArgs: Array<string> = paramNames.map(name => {
                        if (name === 'joinPoint') return joinPoint;
                        return args[paramNames.indexOf(name)];
                    });
                    advice.method.apply(this, adviceArgs);
                }
            });
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
        const originalMethod: Function = descriptor.value;
        descriptor.value = function (...args: any[]): any {
            const result: any = originalMethod.apply(this, args);
            const joinPoint: JoinPoint = new JoinPoint(this, propertyKey as string, args);
            const afterReturningAdvices: Array<{
                pointcut: string,
                method: Function
            }> = Reflect.getMetadata('afterReturning', target.constructor) || [];
            afterReturningAdvices.forEach((advice: { pointcut: string, method: Function }) => {
                if (advice.pointcut === pointcut) {
                    const paramNames: Array<string> = argNames ? argNames.split(',') : getParameterNames(target.constructor, propertyKey as string);
                    const adviceArgs: Array<any> = paramNames.map(name => {
                        if (name === 'joinPoint') return joinPoint;
                        if (name === 'result') return result;
                        return args[paramNames.indexOf(name)];
                    });
                    advice.method.apply(this, adviceArgs);
                }
            });
            return result;
        };
        const existingAfterReturningAdvices: Array<{
            pointcut: string,
            method: Function
        }> = Reflect.getMetadata('afterReturning', target.constructor) || [];
        existingAfterReturningAdvices.push({pointcut, method: (target as any)[propertyKey as string]});
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
        const originalMethod: Function = descriptor.value;
        descriptor.value = function (...args: any[]): any {
            try {
                return originalMethod.apply(this, args);
            } catch (error: any) {
                const joinPoint: JoinPoint = new JoinPoint(this, propertyKey as string, args);
                const afterThrowingAdvices: Array<{
                    pointcut: string,
                    method: Function
                }> = Reflect.getMetadata('afterThrowing', target.constructor) || [];
                afterThrowingAdvices.forEach((advice: { pointcut: string, method: Function }) => {
                    if (advice.pointcut === pointcut) {
                        const paramNames: Array<string> = argNames ? argNames.split(',') : getParameterNames(target.constructor, propertyKey as string);
                        const adviceArgs: Array<any> = paramNames.map(name => {
                            if (name === 'joinPoint') return joinPoint;
                            if (name === 'error') return error;
                            return args[paramNames.indexOf(name)];
                        });
                        advice.method.apply(this, adviceArgs);
                    }
                });
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
        const originalMethod: Function = descriptor.value;
        descriptor.value = function (...args: any[]): any {
            const joinPoint: JoinPoint = new JoinPoint(this, propertyKey as string, args);
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
        const originalMethod: Function = descriptor.value;
        descriptor.value = function (...args: any[]): any {
            const joinPoint: JoinPoint = new JoinPoint(this, propertyKey as string, args);
            const aroundAdvices: Array<{
                pointcut: string,
                method: Function
            }> = Reflect.getMetadata('around', target.constructor) || [];
            let result: any;
            aroundAdvices.forEach((advice: { pointcut: string, method: Function }) => {
                if (advice.pointcut === pointcut) {
                    const paramNames: Array<string> = argNames ? argNames.split(',') : getParameterNames(target.constructor, propertyKey as string);
                    const adviceArgs: Array<any> = paramNames.map(name => {
                        if (name === 'joinPoint') return joinPoint;
                        return args[paramNames.indexOf(name)];
                    });
                    result = advice.method.apply(this, adviceArgs.concat(() => originalMethod.apply(this, args)));
                }
            });
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
