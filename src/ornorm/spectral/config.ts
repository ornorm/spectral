/**
 * @file config.ts
 * @description This file contains the configuration for the Spectral framework,
 * including definitions for aspects, pointcuts, and advices.
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

import {AdviceType} from '@ornorm/spectral';

/**
 * Represents the configuration for a pointcut.
 */
export type PointcutConfig = {
    /**
     * The unique identifier for the pointcut.
     */
    id: string;
    /**
     * The expression that defines the pointcut.
     */
    expression: string;
};

/**
 * Represents the configuration for an advice.
 */
export type AdviceConfig = {
    /**
     * The type of advice.
     * @see AdviceType
     */
    type: AdviceType;
    /**
     * The reference to a pointcut by its id.
     */
    pointcutRef?: string;
    /**
     * The pointcut expression.
     */
    pointcut?: string;
    /**
     * The method name that contains the advice logic.
     */
    method: string;
    /**
     * The name of the returning value (used in afterReturning advice).
     */
    returning?: string;
    /**
     * The name of the throwing value (used in afterThrowing advice).
     */
    throwing?: string;
    /**
     * The argument names used in the advice method.
     */
    argNames?: string;
};

/**
 * Represents the configuration for an advisor.
 */
export type AdvisorConfig = {
    /**
     * The unique identifier for the advisor.
     */
    id: string;
    /**
     * The advice configuration associated with the advisor.
     * @see AdviceConfig
     */
    advice: AdviceConfig;
    /**
     * The pointcut configuration associated with the advisor.
     * Can be either a class filter or a method matcher.
     * @see ClassFilterConfig
     * @see MethodMatcherConfig
     */
    pointcut: ClassFilterConfig | MethodMatcherConfig;
};

/**
 * Represents the configuration for a class filter.
 */
export type ClassFilterConfig = {
    /**
     * The unique identifier for the class filter.
     */
    id: string;
    /**
     * The class name pattern to match.
     */
    pattern: string;
};

/**
 * Represents the configuration for a method matcher.
 */
export type MethodMatcherConfig = {
    /**
     * The unique identifier for the method matcher.
     */
    id: string;
    /**
     * Flag to indicate if the method matcher is evaluated at runtime.
     */
    isRuntime: boolean;
    /**
     * The pattern to match method names.
     */
    pattern: string;
};

/**
 * Represents the configuration for an aspect.
 */
export type AspectConfig = {
    /**
     * The unique identifier for the aspect.
     */
    id: string;
    /**
     * The reference to the aspect class.
     */
    ref: string;
    /**
     * The order in which the aspect should be applied.
     */
    order?: number;
    /**
     * The pointcuts defined within the aspect.
     * @see PointcutConfig
     */
    pointcuts?: Array<PointcutConfig>;
    /**
     * The advices defined within the aspect.
     * @see AdviceConfig
     */
    advices: Array<AdviceConfig>;
};

/**
 * Represents the configuration for AOP (Aspect-Oriented Programming).
 */
export type AopConfig = {
    /**
     * The global pointcuts defined in the configuration.
     * @see PointcutConfig
     */
    pointcuts?: Array<PointcutConfig>;
    /**
     * The aspects defined in the configuration.
     * @see AspectConfig
     */
    aspects: Array<AspectConfig>;
    /**
     * The advisors defined in the configuration.
     * @see AdvisorConfig
     */
    advisors?: Array<AdvisorConfig>;
    /**
     * Flag to indicate if CGLIB proxies should be used.
     */
    proxyTargetClass?: boolean;
    /**
     * Flag to indicate if AspectJ proxies should be used.
     */
    useAspectJ?: boolean;
    /**
     * Flag to indicate if the proxy configuration is frozen.
     */
    frozen?: boolean;
    /**
     * Flag to indicate if the current proxy should be exposed.
     */
    exposeProxy?: boolean;
};
