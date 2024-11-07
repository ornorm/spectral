import { Advice, RegexpMethodPointcut } from '@ornorm/spectral';

/**
 * Class representing a pointcut advisor that combines a pointcut and an advice.
 */
export class RegexpMethodPointcutAdvisor {
    private readonly privateAdvice: Advice;
    private readonly privatePointcut: RegexpMethodPointcut;

    /**
     * Creates an instance of RegexpMethodPointcutAdvisor.
     * @param patterns - An array of string patterns to be used in the pointcut.
     * @param advice - The advice to be applied at the pointcut.
     * @see Advice
     */
    constructor(patterns: Array<string>, advice: Advice) {
        this.privateAdvice = advice;
        this.privatePointcut = new RegexpMethodPointcut(patterns);
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
     * @see RegexpMethodPointcut.
     */
    public get pointcut(): RegexpMethodPointcut {
        return this.privatePointcut;
    }
}
