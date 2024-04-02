import * as THREE from 'three';


import { PointBuffer } from './PointBuffer';

/**
 * Represents a point cloud in the scene.
 */
export class PointCloud {

    /**
     * Displays each point in this point cloud.
     * 
     * @type {THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>}
     */
    #points;

    /**
     * @type {THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>}
     */
    get points() { return this.#points; }

    /**
     * The buffer containing the data of this point cloud.
     * 
     * @readonly
     * @type {PointBuffer}
     */
    buffer;

    /**
     * @type {THREE.Vector3[]}
     */
    #bufferNDC = [];

    /**
     * 
     * @type {THREE.Vector3[]}
     */
    get bufferNDC() { return this.#bufferNDC; }

    set bufferNDC(value) { this.#bufferNDC = value; }

    /**
     * 
     * @returns {number} Number of point's cloud channel
     */
    get numChannels() { return this.buffer.numChannels; }

    // /**
    //  * @readonly
    //  * @type {string[]}
    //  */
    // #channelNames;

    // /**
    //  * @returns {string[]} list of pcd channel names.
    //  */
    // get channelNames() { return this.#channelNames; }

    /**
     * Controls the display size of the points in this point cloud.
     * 
     * @type {number}
     */
    get pointSize() { return this.#points.material.size; }

    set pointSize(value) { this.#points.material.size = value; }

    /**
     * Creates a new point cloud.
     * 
     * @param {PointBuffer} buffer The buffer containing the data of the point cloud.
     * @param {number} pointSize Controls the display size of the points.
     */
    constructor(buffer, pointSize) {
        this.buffer = buffer;
        // this.#channelNames = channelNames;

        const geometry = new THREE.BufferGeometry().setFromPoints(buffer.getCoords());

        const material = new THREE.PointsMaterial({
            size: pointSize,
            sizeAttenuation: false,
            color: new THREE.Color(),
        });

        this.#points = new THREE.Points(geometry, material);
        this.#points.renderOrder = -1;
    }

    /**
     * Creates a deep copy of this point cloud (detached from its parents).
     * @returns {PointCloud} The newly created copy.
     */
    clone() {
        return new PointCloud(
            this.buffer,
            this.pointSize,
        );
    }

    /**
     * Returns a `three.js` representation of this object.
     * 
     * @returns {THREE.Object3D} The resulting object.
     */
    asObject3D() { return this.#points; }

    /**
     * Performs raycasting against this object.
     * 
     * @param {THREE.Raycaster} raycaster The caster of the ray.
     * @param {THREE.Intersection[]} intersects If provided, the results are accumulated into
     * this array. Otherwise, a new one is instantiated.
     * @returns {THREE.Intersection[]} Refer to the `raycast` method of {@link THREE.Object3D}.
     */
    raycast(raycaster, intersects = []) {
        return raycaster.intersectObject(this.#points, false, intersects);
    }
}
