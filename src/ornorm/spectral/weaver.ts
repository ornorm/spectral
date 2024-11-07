import {
    AdviceConfig,
    After,
    AfterReturning,
    AfterThrowing,
    AopConfig,
    Around,
    AspectConfig,
    Before,
    Disposable,
    PointcutConfig
} from '@ornorm/spectral';

/**
 * Class representing a factory for creating proxies.
 * @see Disposable
 */
export class ProxyFactory<T extends object = any> implements Disposable {
    private target: any;
    private readonly interfaces: Array<Function> = [];
    private readonly advices: Array<Function> = [];
    private useCglib: boolean = false;
    private useAspectJ: boolean = false;
    private frozen: boolean = false;
    private exposeProxy: boolean = false;
    private revocableProxy: {
        proxy: any, revoke: () => void
    } | null = null;

    /**
     * Creates an instance of ProxyFactory.
     * @param target - The target object to be proxied.
     */
    constructor(target: any) {
        this.target = target;
    }

    public get isAspectJ(): boolean {
        return this.useAspectJ;
    }

    public set isAspectJ(value: boolean) {
        this.setUseAspectJ(value);
    }

    public get isCglib(): boolean {
        return this.useCglib;
    }

    public set isCglib(value: boolean) {
        this.setUseCglib(value);
    }

    public get isExposed(): boolean {
        return this.exposeProxy;
    }

    public set isExposed(value: boolean) {
        this.setExposeProxy(value);
    }

    public get isFrozen(): boolean {
        return this.frozen;
    }

    public set isFrozen(value: boolean) {
        this.setFrozen(value);
    }

    /**
     * Gets the proxy object.
     */
    public get proxy(): T {
        if (this.exposeProxy) {
            // Logic to expose the proxy in a ThreadLocal or similar mechanism
        }
        if (this.useAspectJ) {
            return this.createAspectJProxy();
        } else if (this.useCglib || this.interfaces.length === 0) {
            return this.createCglibProxy();
        }
        return this.createTsDynamicProxy();
    }

    public set proxy(value: T) {
        this.dispose();
        this.target = value;
    }

    /**
     * Adds advice to the proxy.
     *
     * @param advice - The advice function to add.
     * @throws TypeError If the proxy configuration is frozen.
     */
    public addAdvice(advice: Function): void {
        this.assertNotFrozen();
        this.advices.push(advice);
    }

    /**
     * Adds an interface to the proxy.
     * @param interfaceType - The interface to add.
     * @throws TypeError If the proxy configuration is frozen.
     */
    public addInterface(interfaceType: Function): void {
        this.assertNotFrozen();
        this.interfaces.push(interfaceType);
    }

    /**
     * Finalizes the proxy, revoking it if necessary and destroying all
     * references.
     */
    public dispose(): void {
        if (this.revocableProxy) {
            this.revocableProxy.revoke();
            this.revocableProxy = null;
        }
        this.target = null;
        this.advices.length = 0;
        this.interfaces.length = 0;
        this.useCglib = false;
        this.useAspectJ = false;
        this.frozen = false;
        this.exposeProxy = false;
    }

    /**
     * Sets whether to expose the proxy.
     * @param exposeProxy - True to expose the proxy, false otherwise.
     */
    public setExposeProxy(exposeProxy: boolean): void {
        this.exposeProxy = exposeProxy;
    }

    /**
     * Sets whether the proxy configuration is frozen.
     * @param frozen - True to freeze the configuration, false otherwise.
     */
    public setFrozen(frozen: boolean): void {
        this.frozen = frozen;
    }

    /**
     * Sets whether to use CGLIB for proxying.
     * @param useCglib - True to use CGLIB, false otherwise.
     */
    public setUseCglib(useCglib: boolean): void {
        this.useCglib = useCglib;
    }

    /**
     * Sets whether to use AspectJ for proxying.
     * @param useAspectJ - True to use AspectJ, false otherwise.
     */
    public setUseAspectJ(useAspectJ: boolean): void {
        this.useAspectJ = useAspectJ;
    }

    /**
     * Asserts that the proxy configuration is not frozen.
     * @throws TypeError If the proxy configuration is frozen.
     */
    protected assertNotFrozen(): void {
        if (this.frozen) {
            throw new TypeError('Cannot modify a frozen proxy configuration');
        }
    }

    protected createTsDynamicProxy(): any {
        if (this.frozen) {
            return new Proxy(this.target, {
                get: (target: any, prop: string, receiver: any) => {
                    const originalMethod: any = Reflect.get(target, prop, receiver);
                    if (typeof originalMethod === 'function') {
                        return (...args: Array<any>) => {
                            this.advices.forEach(advice => advice());
                            return Reflect.apply(originalMethod, target, args);
                        };
                    }
                    return originalMethod;
                }
            });
        } else {
            this.revocableProxy = Proxy.revocable(this.target, {
                get: (target: any, prop: string, receiver: any) => {
                    const originalMethod: any = Reflect.get(target, prop, receiver);
                    if (typeof originalMethod === 'function') {
                        return (...args: Array<any>) => {
                            this.advices.forEach(advice => advice());
                            return Reflect.apply(originalMethod, target, args);
                        };
                    }
                    return originalMethod;
                }
            });
            return this.revocableProxy.proxy;
        }
    }

    protected createCglibProxy(): any {
        const proxy: any = Object.create(this.target);
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this.target))) {
            const method: any = Reflect.get(this.target, key);
            if (typeof method === 'function') {
                Reflect.defineProperty(proxy, key, {
                    value: (...args: Array<any>) => {
                        this.advices.forEach((advice: Function) => advice());
                        return Reflect.apply(Reflect.get(this.target, key), this, args);
                    },
                    configurable: true,
                    enumerable: true,
                    writable: true
                });
            }
        }
        return proxy;
    }

    protected createAspectJProxy(): any {
        return new Proxy(this.target, {
            get: (target: any, prop: string, receiver: any) => {
                const originalMethod: any = Reflect.get(target, prop, receiver);
                if (typeof originalMethod === 'function') {
                    return (...args: Array<any>) => {
                        this.advices.forEach((advice: Function) => {
                            const advices: Array<{ pointcut: string, method: Function }> =
                                Reflect.getMetadata('before', advice) || [];
                            advices.forEach((advice: { pointcut: string, method: Function }) => {
                                if (this.matchesPointcut(advice.pointcut, prop)) {
                                    advice.method.apply(this, args);
                                }
                            });
                        });
                        return Reflect.apply(originalMethod, target, args);
                    };
                }
                return originalMethod;
            }
        });
    }

    protected matchesPointcut(pointcut: string, methodName: string): boolean {
        return pointcut.includes(methodName);
    }
}

/**
 * Class representing the AOP weaver.
 */
export class Weaver {
    private static pointcuts: Map<string, string> = new Map<string, string>();
    private static useCglib: boolean = false;
    private static useAspectJ: boolean = false;
    private static frozen: boolean = false;
    private static exposeProxy: boolean = false;
    private static proxies: ProxyFactory[] = [];

    private constructor() {}

    /**
     * Configures the AOP weaver with the given configuration.
     * @param config - The AOP configuration.
     * @returns A promise that resolves when the configuration is complete.
     */
    public static boot(config: AopConfig): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                Weaver.useCglib = config.proxyTargetClass ?? false;
                Weaver.useAspectJ = config.useAspectJ ?? false;
                Weaver.frozen = config.frozen ?? false;
                Weaver.exposeProxy = config.exposeProxy ?? false;
                config.pointcuts?.forEach((pointcutConfig: PointcutConfig) =>
                    Weaver.pointcuts.set(pointcutConfig.id, pointcutConfig.expression)
                );
                const sortedAspects: Array<AspectConfig> =
                    config.aspects.sort(
                        (a: AspectConfig, b: AspectConfig) =>
                            (a.order || 0) - (b.order || 0)
                    );
                for (const aspectConfig of sortedAspects) {
                    try {
                        const aspectModule: any = await import(`./${aspectConfig.ref}`);
                        const proxyFactory: ProxyFactory = new ProxyFactory(aspectModule.default);
                        proxyFactory.setUseCglib(Weaver.useCglib);
                        proxyFactory.setUseAspectJ(Weaver.useAspectJ);
                        proxyFactory.setFrozen(Weaver.frozen);
                        proxyFactory.setExposeProxy(Weaver.exposeProxy);
                        aspectConfig.advices.forEach((adviceConfig: AdviceConfig) =>
                            proxyFactory.addAdvice(
                                Reflect.get(aspectModule.default.prototype, adviceConfig.method)
                            ));
                        Weaver.proxies.push(proxyFactory);
                        Weaver.weave(proxyFactory.proxy, aspectConfig);
                    } catch (e: any) {
                        reject(e);
                    }
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Finalizes all proxies, revoking them if necessary and destroying all references.
     * @returns A promise that resolves when finalization is complete.
     */
    public static dispose(): Promise<void> {
        return new Promise<void>((resolve) => {
            Weaver.proxies.forEach(proxyFactory => proxyFactory.dispose());
            Weaver.proxies.length = 0;
            Weaver.pointcuts.clear();
            Weaver.useCglib = false;
            Weaver.useAspectJ = false;
            Weaver.frozen = false;
            Weaver.exposeProxy = false;
            resolve();
        });
    }

    /**
     * Weaves the given target with the specified aspect configuration.
     * @param target - The target function to weave.
     * @param config - The aspect configuration.
     */
    private static weave(target: Function, config: AspectConfig): void {
        Reflect.defineMetadata('aspect', true, target);
        config.pointcuts?.forEach((pointcutConfig: PointcutConfig) => {
            Weaver.pointcuts.set(pointcutConfig.id, pointcutConfig.expression);
        });

        config.advices.forEach((adviceConfig: AdviceConfig) => {
            const pointcutExpression: string | undefined = adviceConfig.pointcut ||
                Weaver.pointcuts.get(adviceConfig.pointcutRef!);
            if (!pointcutExpression) {
                throw new ReferenceError(`Pointcut ${adviceConfig.pointcutRef} not found`);
            }
            const method: Function | undefined = Reflect.get(target.prototype, adviceConfig.method);
            if (!method) {
                throw new ReferenceError(`Method ${adviceConfig.method} not found in aspect ${config.id}`);
            }
            const descriptor: PropertyDescriptor | undefined =
                Object.getOwnPropertyDescriptor(target.prototype, adviceConfig.method);
            if (descriptor) {
                switch (adviceConfig.type) {
                    case 'before':
                        Before(pointcutExpression, adviceConfig.argNames)(target.prototype, adviceConfig.method, descriptor);
                        break;
                    case 'after':
                        After(pointcutExpression, adviceConfig.argNames)(target.prototype, adviceConfig.method, descriptor);
                        break;
                    case 'afterReturning':
                        AfterReturning(pointcutExpression, adviceConfig.returning)(target.prototype, adviceConfig.method, descriptor);
                        break;
                    case 'afterThrowing':
                        AfterThrowing(pointcutExpression, adviceConfig.throwing)(target.prototype, adviceConfig.method, descriptor);
                        break;
                    case 'around':
                        Around(pointcutExpression, adviceConfig.argNames)(target.prototype, adviceConfig.method, descriptor);
                        break;
                }
            } else {
                throw new ReferenceError(`Method ${adviceConfig.method} not found in aspect ${config.id}`);
            }
        });
    }
}
