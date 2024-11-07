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
        this.patterns = patterns.map((pattern: string): RegExp => new RegExp(pattern));
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
        method: Method,
        type: Type<T>,
        ...args: Array<any>
    ): boolean {
        return this.patterns.some((pattern: RegExp): boolean => pattern.test(method.name));
    }
}
