/**
 * Tests whether every element in the provided collection matches a predicate.
 * 
 * Note that this method returns `true` for empty collections.
 * 
 * @template T The type of element in the collection.
 * @param {Iterable<T>} collection The collection to iterate over.
 * @param {(v: T) => boolean} predicate The predicate to test.
 * @returns {boolean} `true` if all elements pass the predicate check, else `false`.
 */
export function every(collection, predicate) {
    for (const v of collection) {
        if (!predicate(v)) return false;
    }

    return true;
}

/**
 * Tests whether any element in the provided collection matches a predicate.
 * 
 * Note that this method returns `false` for empty collections.
 * 
 * @template T The type of element in the collection.
 * @param {Iterable<T>} collection The collection to iterate over.
 * @param {(v: T) => boolean} predicate The predicate to test.
 * @returns {boolean} `true` if any element passes the predicate check, else `false`.
 */
export function some(collection, predicate) {
    for (const v of collection) {
        if (predicate(v)) return true;
    }

    return false;
}

/**
 * A set-like view of the keys in a {@link Map}.
 * 
 * Changes to the underlying map are reflected in this object.
 * 
 * @template K The data type of the keys.
 * @implements {ReadonlySet<K>}
 */
export class KeyView {

    /**
     * The map containing the keys.
     * 
     * @readonly
     * @type {ReadonlyMap<K, any>}
     */
    map;

    /**
     * Creates a live view of the keys of a {@link Map}.
     * 
     * @param {ReadonlyMap<K, any>} map The map containing the keys.
     */
    constructor(map) {
        this.map = map;
    }

    /**
     * @type {(
     *     callbackfn: (value: K, value2: K, set: this) => void,
     *     thisArg?: any
     * ) => void}
     */
    forEach(callbackfn, thisArg = undefined) {
        this.map.forEach((v, k) => callbackfn(k, k, this), thisArg);
    }

    /**
     * @type {(value: K) => boolean}
     */
    has(value) { return this.map.has(value); }

    /**
     * @type {number}
     */
    get size() { return this.map.size; }

    /**
     * @type {() => IterableIterator<K>}
     */
    [Symbol.iterator]() { return this.values(); }

    /**
     * @type {() => IterableIterator<K>}
     */
    values() { return this.map.keys(); }

    /**
     * @type {() => IterableIterator<K>}
     */
    keys() { return this.values(); }

    /**
     * @type {() => IterableIterator<[K, K]>}
     */
    * entries() {
        for (const v of this.values()) {
            yield [v, v];
        }
    }
}

/**
 * A {@link Map} that creates and returns a default value when {@link DefaultMap.get} is called
 * for a key that does not exist.
 * 
 * Note that this does not affect other methods such as {@link DefaultMap.has}.
 * 
 * @template K The data type of the keys.
 * @template V The data type of the values.
 * @implements {Map<K, V>}
 */
export class DefaultMap extends Map {

    /**
     * Constructs the default value assigned to a missing key when {@link DefaultMap.get} is called.
     * 
     * @type {() => V}
     */
    defaultFactory;

    /**
     * Creates a new {@link Map} that creates and returns a default value when
     * {@link DefaultMap.get} is called for a key that does not exist.
     * 
     * @param {() => (V)} defaultFactory Constructs the default value assigned to a missing key
     * when {@link DefaultMap.get} is called.
     * @param {?Iterable<[K, V]>} entries An iterable object whose elements are key-value pairs.
     * Each key-value pair is added to the new map.
     */
    constructor(defaultFactory, entries = null) {
        super(entries);

        this.defaultFactory = defaultFactory;
    }

    /**
     * @type {(key: K) => V}
     */
    get(key) {
        if (!this.has(key)) {
            this.set(key, this.defaultFactory());
        }

        return super.get(key);
    }
}

/**
 * An read-only array with elements that can also be accessed by key.
 * 
 * @template K The data type of the keys.
 * @template V The data type of the values.
 */
export class ReadonlyArrayMap {

    /**
     * A function that returns the corresponding key from an element of the array.
     * 
     * @readonly
     * @type {(v: V) => K}
     */
    getKey;

    /**
     * The array containing each element.
     * 
     * @readonly
     * @type {ReadonlyArray<V>}
     */
    elements;

    /**
     * @readonly
     * @type {ReadonlyMap<K, number>}
     */
    #idxByKey;

    /**
     * Creates a new read-only array with elements that can also be accessed by key through a
     * mapping.
     * 
     * @param {(v: V) => K} getKey A function that returns the key of an element. This key should
     * be immutable and unique among all of the elements.
     * @param {ReadonlyArray<V>} elements The array containing each element. A shallow copy of
     * the array is made to this object.
     */
    constructor(getKey, elements = []) {
        this.elements = [...elements];
        this.getKey = getKey;

        this.#idxByKey = new Map(elements.map((e, i) => [getKey(e), i]));
        if (this.#idxByKey.size !== elements.length) {
            throw new Error('Some of the keys are duplicated');
        }
    }

    /**
     * Gets an element in this array.
     * 
     * @param {K} key The key of the element to test.
     * @returns {V | undefined} The element matching the key, or `undefined` if not found.
     */
    findByKey(key) {
        const idx = this.findIndexByKey(key);
        return (idx == null) ? undefined : this.elements[idx];
    }

    /**
     * Gets an the index of an element in this array.
     * 
     * @param {K} key The key of the element to test.
     * @returns {number | undefined} The index of the element matching the key, or `undefined`
     * if not found.
     */
    findIndexByKey(key) {
        if (!this.#idxByKey.has(key)) return undefined;
        return this.#idxByKey.get(key);
    }

    /**
     * Tests whether an element exists in this array.
     * 
     * @param {K} key The key of the element to test.
     * @returns {boolean} `true` if the element exists; otherwise, `false`.
     */
    includesByKey(key) {
        return this.findIndexByKey(key) !== undefined;
    }

    /**
     * The number of elements in this array.
     * 
     * @type {number}
     */
    get length() { return this.elements.length; }

    /**
     * @type {() => IterableIterator<V>}
     */
    [Symbol.iterator]() { return this.elements[Symbol.iterator](); }
}
