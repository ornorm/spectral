/**
 * @file regexp-method-expression-advisor.ts
*  @description This file contains the implementation of the RegexpMethodPointcutAdvisor
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

import {Advice, Advisor, RegexpMethodPointcut} from '@ornorm/spectral';

/**
 * Class representing a expression advisor that combines a expression and advice.
 * @see Advisor
 */
export class RegexpMethodPointcutAdvisor extends Advisor {
    /**
     * Creates an instance of RegexpMethodPointcutAdvisor.
     * @param advice - The advice to be applied at the expression.
     * @param patterns - An array of string patterns to be used in the expression.
     * @see Advice
     */
    constructor(advice: Advice, patterns: Array<string>) {
        super(advice, new RegexpMethodPointcut(patterns));
    }
}