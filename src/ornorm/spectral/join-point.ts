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
