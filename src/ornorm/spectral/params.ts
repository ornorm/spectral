
/**
 * Interface for discovering parameter names.
 */
export interface ParameterNameDiscoverer {
    /**
     * Retrieves the parameter names for a given method.
     * @param target - The target function.
     * @param methodName - The name of the method.
     * @returns An array of parameter names or undefined if not found.
     */
    getParameterNames(target: Function, methodName: string): Array<string> | undefined;
}

/**
 * Implementation of ParameterNameDiscoverer that uses annotation
 * metadata.
 * @see ParameterNameDiscoverer
 */
export class AnnotationParameterNameDiscoverer implements ParameterNameDiscoverer {
    /**
     * @inheritdoc
     */
    public getParameterNames(target: Function, methodName: string): Array<string> | undefined {
        const metadata: string | undefined =
            Reflect.getMetadata('argNames', target.prototype, methodName);
        return metadata ? metadata.split(',') : undefined;
    }
}

/**
 * Implementation of ParameterNameDiscoverer that uses standard
 * reflection.
 * @see ParameterNameDiscoverer
 */
export class StandardReflectionParameterNameDiscoverer implements ParameterNameDiscoverer {
    /**
     * @inheritdoc
     */
    public getParameterNames(target: Function, methodName: string): Array<string> | undefined {
        const method: Function | undefined = target.prototype[methodName];
        if (method && method.length) {
            return Reflect.getMetadata('design:paramtypes', target.prototype, methodName)
                .map((param: any) => param.name);
        }
        return undefined;
    }
}

const parameterNameDiscoverers: ParameterNameDiscoverer[] = [
    new AnnotationParameterNameDiscoverer(),
    new StandardReflectionParameterNameDiscoverer()
];

/**
 * Retrieves the parameter names for a given method using registered discoverers.
 * @param target - The target function.
 * @param methodName - The name of the method.
 * @returns An array of parameter names.
 * @throws TypeError if unable to determine parameter names.
 */
export function getParameterNames(target: Function, methodName: string): Array<string> {
    for (const discoverer of parameterNameDiscoverers) {
        const names: Array<string> | undefined = discoverer.getParameterNames(target, methodName);
        if (names) {
            return names;
        }
    }
    throw new TypeError(`Unable to determine parameter names for method: ${methodName}`);
}

