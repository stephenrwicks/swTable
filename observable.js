export { Observable };
class Observable {
    constructor(target) {
        // Setting target triggers createNestedProxy
        if (target)
            this.target = target;
    }
    createNestedProxy(obj, path = []) {
        const handler = {
            get: (target, property, receiver) => {
                const value = Reflect.get(target, property, receiver);
                if (value === null || typeof value === 'undefined')
                    return value;
                // Returns nested proxy of generic objects and arrays, but not Dates or custom classes, etc.
                if (Object.getPrototypeOf(value) === Object.prototype)
                    return this.createNestedProxy(value, [...path, property]);
                if (Object.getPrototypeOf(value) === null)
                    return this.createNestedProxy(value, [...path, property]);
                if (Array.isArray(value))
                    return this.createNestedProxy(value, [...path, property]);
                return value;
            },
            set: (target, property, value, receiver) => {
                const success = Reflect.set(target, property, value, receiver);
                if (success) {
                    Reflect.set(this.target, property, value); // Keep the original object in sync
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
        this.#callbacks = null;
        this.#proxy = null;
        this.#target = null;
    }
}
