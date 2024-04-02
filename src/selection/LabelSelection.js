import * as THREE from 'three';
import { LabelClass } from './LabelClass';

/**
 * @typedef {Object} LabelSelectionParams
 * @property {number} id The instance of the label selection.
 * @property {THREE.Vector3[]} points The points included to shape the label selection.
 * @property {number} pointSize point size to display the label selection.
 */

export class LabelSelection {

    /**
     * @type {number}
     */
    #id;

    /**
     * @type {number}
     */
    get id() { return this.#id; }

    /**
     * @type {THREE.Vector3[]}
     */
    #points;

    /**
     * @type {THREE.Vector3[]}
     */
    get points() { return this.#points; }

    /**
     * Display each point in this selection.
     * 
     * @type {THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>}
     */
    #selection;

    /**
     * @type {THREE.Vector3[]}
     */
    #pointsNDC;

    /**
     * 
     * @type {THREE.Vector3[]}
     */
    get pointsNDC() { return this.#pointsNDC; }

    set pointsNDC(value) { this.#pointsNDC = value; }

    /**
     * Resets the points of this selection.
     * 
     * @param {THREE.Vector3[]} points 
     */
    updateSelectionPoints(points) {
        this.#points = points;
        this.#selection.geometry.setFromPoints(this.points);
        this.#selection.geometry.getAttribute('position').needsUpdate = true;
    }

    /**
     * Controls the display size of the points in this point cloud selection.
     * 
     * @type {number}
     */
    get pointSize() { return this.#selection.material.size; }

    set pointSize(value) { this.#selection.material.size = value; }

    /**
     * Constructs an instance of this object.
     * 
     * @param {LabelSelectionParams} params The parameters of the label selection.
     */
    constructor(params) {
        const { id, points, pointSize} = params;
        this.#id = id;
        this.#points = points;

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.PointsMaterial({
            sizeAttenuation: false,
            size: pointSize,
        });

        this.#selection = new THREE.Points(geometry, material);
    }

    /**
     * Displays the color of points representing this selection.
     * 
     * @param {THREE.Color | THREE.ColorRepresentation} color 
     */
    setColor(color) {
        this.#selection.material.color.set(color);
        this.#selection.material.needsUpdate = true;
    }

    /**
     * @type {LabelClass}
     */
    #labelClass;

    /**
     * The type of this labelled object.
     * 
     * @type {LabelClass}
     */
    get labelClass() { return this.#labelClass; }

    set labelClass(value) {
        if (this.labelClass !== value) {
            this.#labelClass = value;
        }
    }

    /**
     * Returns a `three.js` representation of this object.
     * 
     * @returns {THREE.Object3D} The resulting object.
     */
    asObject3D() { return this.#selection; }

    /**
     * Performs raycasting against this object.
     * 
     * @param {THREE.Raycaster} raycaster The caster of the ray.
     * @param {THREE.Intersection[]} intersects If provided, the results are accumulated into
     * this array. Otherwise, a new one is instantiated.
     * @returns {THREE.Intersection[]} Refer to the `raycast` method of {@link THREE.Object3D}.
     */
    raycast(raycaster, intersects = []) {
        return raycaster.intersectObject(this.#selection, false, intersects);
    }

}