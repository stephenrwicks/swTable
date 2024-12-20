export { Observable };
//@ts-ignore
// window.getCount = 0;
class Observable {
    constructor(target) {
        // Setting target triggers createNestedProxy
        if (target)
            this.target = target;
    }
    // What if you set the value of an entire subobject?
    // Memoization. This WeakMap stores nested proxies so that they only have to be created once
    #cache = new WeakMap();
    createNestedProxy(obj, path = []) {
        if (this.#cache.has(obj))
            return this.#cache.get(obj); // Return cached proxy if available
        const handler = {
            get: (target, property, receiver) => {
                //@ts-ignore
                // window.getCount++;
                // //@ts-ignore
                // console.log(window.getCount);
                const value = Reflect.get(target, property, receiver);
                if (value === null || typeof value === 'undefined')
                    return value;
                // Returns nested proxy of generic objects and arrays, but not Dates or custom classes, etc.
                if (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
                    return this.createNestedProxy(value, [...path, property]);
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
        console.log('new proxy created'); // If we use cache, this line is never reached after initialization
        this.#cache.set(obj, proxy);
        return proxy; // Return a new proxy object
    }
    #fireCallbacks(key, oldPropValue, newPropValue) {
        // Also pass down key?
        console.log(key, oldPropValue, newPropValue);
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
        this.#proxy = this.createNestedProxy(target);
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
