/**
 * @file point-cut-selector-advisor.ts
 * @description This file contains the implementation of the PointcutSelectorAdvisor
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

import {Advice, Method, PointcutSelector, Type} from '@ornorm/spectral';

/**
 * Class representing an advisor that uses a pointcut selector to determine
 * if a method matches the criteria.
 */
export class PointcutSelectorAdvisor {
    private readonly privateAdvice: Advice;
    private readonly privatePointcut: PointcutSelector;

    /**
     * Creates an instance of `PointcutSelectorAdvisor`.
     * @param selector - The pointcut selector to be used for matching.
     * @param advice - The advice to be applied at the pointcut.
     * @see Advice
     */
    constructor(selector: string, advice: Advice) {
        this.privateAdvice = advice;
        this.privatePointcut = new PointcutSelector(selector);
    }

    /**
     * Gets the advice.
     * @see Advice.
     */
    public get advice(): Advice {
        return this.privateAdvice;
    }

    /**
     * Gets the pointcut.
     * @see PointcutSelector.
     */
    public get pointcut(): PointcutSelector {
        return this.privatePointcut;
    }

    /**
     * Determines if the given method matches the criteria defined by the
     * pointcut selector.
     * @param method The method to check against the pointcut criteria.
     * @param type The class of the target object.
     * @param args Additional runtime arguments.
     * @returns True if the method matches the criteria, otherwise false.
     */
    public matches<T extends object = any>(
        method: Method, type: Type<T>, args: Array<any>
    ): boolean {
        return this.pointcut.matches(method, type, args);
    }
}
