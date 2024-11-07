import {AdviceType} from '@spectral';

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
