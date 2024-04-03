import * as THREE from 'three';

/**
 * Represents a mapping between the coordinate system of a project and that of `three.js`,
 * where the name of the mapping is formed by iterating over the axes in `three.js` and
 * returning the corresponding axes in the project.
 * 
 * For example, if `(1, 2, 3)` in `three.js` corresponds to `(3, 1, 2)` in the project,
 * the coordinate format is taken to be `ZXY`.
 * 
 * This is a value-based class.
 */
class CoordinateFormatSpec {

    /**
     * The name of this mapping.
     * 
     * @readonly
     * @type {string}
     */
    #name;

    /**
     * The index of the coordinates in project format that represents
     * the `x` coordinate in `three.js` format.
     * 
     * @readonly
     * @type {number}
     */
    #xIdx;

    /**
     * The index of the coordinates in project format that represents
     * the `y` coordinate in `three.js` format.
     * 
     * @readonly
     * @type {number}
     */
    #yIdx;

    /**
     * The index of the coordinates in project format that represents
     * the `z` coordinate in `three.js` format.
     * 
     * @readonly
     * @type {number}
     */
    #zIdx;

    /**
     * Creates a new mapping between the coordinate system of a project and that of `three.js`.
     * 
     * @param {string} name The name of the mapping.
     * @param {number} xIdx The index of the coordinates in project format that represents
     * the `x` coordinate in `three.js` format.
     * @param {number} yIdx The index of the coordinates in project format that represents
     * the `y` coordinate in `three.js` format.
     * @param {number} zIdx The index of the coordinates in project format that represents
     * the `z` coordinate in `three.js` format.
     */
    constructor(name, xIdx, yIdx, zIdx) {
        this.#name = name;
        this.#xIdx = xIdx;
        this.#yIdx = yIdx;
        this.#zIdx = zIdx;

        Object.freeze(this);
    }

    /**
     * Returns a string representation of an object.
     * 
     * @returns {string} A string representing this object.
     */
    toString() {
        return `CoordinateFormat.${this.#name}`;
    }

    /**
     * Converts a set of coordinates from `three.js` format into project format.
     * 
     * @param {THREE.Vector3} threeJSCoords The original coordinates.
     * @returns {THREE.Vector3} The converted coordinates.
     */
    toProjectCoords(threeJSCoords) {
        return new THREE.Vector3()
            .setComponent(this.#xIdx, threeJSCoords.x)
            .setComponent(this.#yIdx, threeJSCoords.y)
            .setComponent(this.#zIdx, threeJSCoords.z);
    }

    /**
     * Converts a set of coordinates from project format into `three.js` format.
     * 
     * @param {THREE.Vector3} projectCoords The original coordinates.
     * @returns {THREE.Vector3} The converted coordinates.
     */
    toThreeJSCoords(projectCoords) {
        const x = projectCoords.getComponent(this.#xIdx);
        const y = projectCoords.getComponent(this.#yIdx);
        const z = projectCoords.getComponent(this.#zIdx);
        return new THREE.Vector3(x, y, z);
    }
}

/**
 * Represents a mapping between the coordinate system of a project and that of `three.js`,
 * where the name of the mapping is formed by iterating over the axes in `three.js` and
 * returning the corresponding axes in the project.
 * 
 * For example, if `(1, 2, 3)` in `three.js` corresponds to `(3, 1, 2)` in the project,
 * the coordinate format is taken to be `ZXY`.
 * 
 * @readonly
 * @enum {CoordinateFormatSpec}
 */
export const CoordinateFormat = Object.freeze({
    XYZ: new CoordinateFormatSpec('XYZ', 0, 1, 2),
    XZY: new CoordinateFormatSpec('XZY', 0, 2, 1),
    YXZ: new CoordinateFormatSpec('YXZ', 1, 0, 2),
    YZX: new CoordinateFormatSpec('YZX', 2, 0, 1),
    ZXY: new CoordinateFormatSpec('ZXY', 1, 2, 0),
    ZYX: new CoordinateFormatSpec('ZYX', 2, 1, 0),
});
