export { Observable };
class Observable {
    constructor(target) {
        this.#target = target;
        this.#proxy = this.#createNestedProxy(target);
    }
    // Memoization. This WeakMap stores nested proxies so that they only have to be created once
    #cache = new WeakMap();
    #createNestedProxy(obj, path = []) {
        if (this.#cache.has(obj))
            return this.#cache.get(obj); // Return cached proxy if available
        const handler = {
            get: (target, property, receiver) => {
                const value = Reflect.get(target, property, receiver);
                if (value === null || typeof value === 'undefined')
                    return value;
                if (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
                    return this.#createNestedProxy(value, [...path, property]);
                }
                return value;
            },
            set: (target, property, value, receiver) => {
                const oldValue = target[property];
                const success = Reflect.set(target, property, value, receiver);
                if (success) {
                    Reflect.set(this.target, property, value); // Keep the original object in sync
                    this.#fireCallbacks(property, oldValue, value);
                }
                return success;
            },
        };
        const proxy = new Proxy(obj, handler);
        this.#cache.set(obj, proxy);
        return proxy;
    }
    #fireCallbacks(key, oldPropValue, newPropValue) {
        // Also pass down key?
        //console.log(key, oldPropValue, newPropValue);
        for (const callback of this.#callbacks) {
            callback();
        }
    }
    #proxy;
    get proxy() {
        return this.#proxy;
    }
    #target;
    get target() {
        return this.#target;
    }
    set target(target) {
        this.#target = target;
        this.#proxy = this.#createNestedProxy(target);
    }
    #callbacks = [];
    get callbacks() {
        return this.#callbacks;
    }
    set callbacks(callbacks) {
        this.#callbacks = callbacks;
    }
    destroy() {
        this.#cache = null;
        this.#callbacks = null;
        this.#proxy = null;
        this.#target = null;
    }
}
