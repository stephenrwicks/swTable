export { Observable };

class Observable<T extends object> {

    constructor(target?: T) {
         // Setting target triggers createNestedProxy
        if (target) this.target = target;
    }

    createNestedProxy(obj: any, path: Array<string | symbol> = []): any {
        const handler: ProxyHandler<any> = {
            get: (target, property, receiver) => {
                const value = Reflect.get(target, property, receiver);
                if (value === null || typeof value === 'undefined') return value;
                // Returns nested proxy of generic objects and arrays, but not Dates or custom classes, etc.
                if (Object.getPrototypeOf(value) === Object.prototype) return this.createNestedProxy(value, [...path, property]);
                if (Object.getPrototypeOf(value) === null) return this.createNestedProxy(value, [...path, property]);
                if (Array.isArray(value)) return this.createNestedProxy(value, [...path, property]);
                return value;
            },
            set: (target, property, value, receiver) => {
                const success = Reflect.set(target, property, value, receiver);
                if (success) {
                    Reflect.set((this.target as T), property, value); // Keep the original object in sync
                    this.#fireCallbacks();
                }
                return success;
            },
        };
        return new Proxy(obj, handler); // Return a new proxy object
    }

    #fireCallbacks() {
        for (const callback of this.#callbacks) {
            callback();
        }
    }

    #proxy?: T;
    get proxy(): T | undefined {
        return this.#proxy;
    }

    #target?: T;
    get target(): T | undefined {
        return this.#target;
    }

    set target(target: T) {
        this.#target = target;
        this.#proxy = this.createNestedProxy(target);
    }

    #callbacks: Array<() => void> = [];
    get callbacks(): Array<() => void> {
        return this.#callbacks;
    }
    set callbacks(callbacks: Array<() => void>) {
        this.#callbacks = callbacks;
    }

    clearCallbacks() {
        this.#callbacks = [];
    }

    destroy() {
        this.#callbacks = null as any;
        this.#proxy = null as any;
        this.#target = null as any;
    }

}