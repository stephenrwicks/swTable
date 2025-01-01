export { Observable };

type DataObject = Record<string, unknown>;
class Observable<T extends DataObject> {

    constructor(target: T) {
        this.#target = target;
        this.#proxy = this.#createNestedProxy(target);
    }

    // Memoization. This WeakMap stores nested proxies so that they only have to be created once
    #cache = new WeakMap<any, any>();

    #createNestedProxy(obj: DataObject, path: Array<string> = []): any {

        if (this.#cache.has(obj)) return this.#cache.get(obj); // Return cached proxy if available

        const handler: ProxyHandler<Record<string, any>> = {
            get: (target, property: string, receiver) => {
                const value = Reflect.get(target, property, receiver);
                if (value === null || typeof value === 'undefined') return value;
                if (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
                    return this.#createNestedProxy(value, [...path, property]);
                }
                return value;
            },
            set: (target, property: string, value, receiver) => {
                const oldValue = target[property];
                const success = Reflect.set(target, property, value, receiver);
                if (success) {
                    Reflect.set((this.target as T), property, value); // Keep the original object in sync
                    this.#fireCallbacks(property, oldValue, value);
                }
                return success;
            },
        };
        
        const proxy = new Proxy(obj, handler);
        this.#cache.set(obj, proxy);
        return proxy;
    }

    #fireCallbacks(key: string | symbol, oldPropValue: any, newPropValue: any) {
        // Also pass down key?
        //console.log(key, oldPropValue, newPropValue);
        for (const callback of this.#callbacks) {
            callback();
        }
    }

    #proxy: typeof Proxy<T>;
    get proxy(): typeof Proxy<T> {
        return this.#proxy;
    }

    #target: T;
    get target(): T {
        return this.#target;
    }

    set target(target: T) {
        this.#target = target;
        this.#proxy = this.#createNestedProxy(target);
    }

    #callbacks: Array<() => any> = [];
    get callbacks(): Array<() => any> {
        return this.#callbacks;
    }
    set callbacks(callbacks: Array<() => void>) {
        this.#callbacks = callbacks;
    }

    destroy() {
        this.#cache = null as any;
        this.#callbacks = null as any;
        this.#proxy = null as any;
        this.#target = null as any;
    }

}