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

import {Advice, Advisor, PointcutSelector} from '@ornorm/spectral';

/**
 * Class representing an advisor that uses a expression selector to determine
 * if a method matches the criteria.
 */
export class PointcutSelectorAdvisor extends Advisor {
    /**
     * Creates an instance of `PointcutSelectorAdvisor`.
     * @param advice - The advice to be applied at the expression.
     * @param selector - The expression selector to be used for matching.
     * @see Advice
     */
    constructor(advice: Advice, selector: string) {
        super(advice, new PointcutSelector(selector));
    }
}
