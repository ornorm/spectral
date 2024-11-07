/**
 * @file params.ts
 * @description This file contains the implementation for the Params
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

