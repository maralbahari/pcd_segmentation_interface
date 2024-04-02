import * as THREE from 'three';

import { CollectionUtils, ThreeUtils } from '../utils';

/**
 * Represents an event dispatched by {@link Picker}:
 * - `type`: The type (i.e., name) of the event.
 * - `object`: The subject of the event.
 * - `isFromPointer`: `true` if the event was dispatched as a result of a pointer event;
 *   otherwise, e.g. if the hovered or selected object was set programatically, `false`.
 * 
 * @template T The type of object that can be selected.
 * @typedef {{
 *     type: 'hoverin' | 'hoverout' | 'selectin' | 'selectout';
 *     object?: ?T;
 *     isFromPointer: boolean;
 * }} PickerEvent
 */

/**
 * Enables a pointer device to select objects in a scene by hovering over
 * and clicking on them.
 * 
 * The following {@link THREE.EventDispatcher} events are available:
 * - `'hoverin'`: Fires when a pointer has entered an object.
 * - `'hoverout'`: Fires when a pointer has exited an object.
 *   This is fired before `'hoverin'` when the pointer hovers over
 *   a different object.
 * - `'selectin'`: Fires when an object has received focus.
 * - `'selectout'`: Fires when an object has lost focus.
 *   This is fired before `'selectin'` when the pointer focuses on
 *   a different object.
 * 
 * @template TObject The type of object that can be selected.
 * @augments THREE.EventDispatcher<PickerEvent<TObject>>
 */
export class Picker extends THREE.EventDispatcher {

    /**
     * @type {boolean}
     */
    #hoverEnabled = true;

    /**
     * Whether the hovered object is updated automatically when the pointer is moved.
     * In any case, it can be set manually.
     * 
     * Note that the currently hovered object is un-hovered upon setting this to `false`.
     * 
     * @type {boolean}
     */
    get hoverEnabled() { return this.#hoverEnabled; }

    set hoverEnabled(value) {
        this.#hoverEnabled = value;

        // Update immediately instead of waiting for the pointer to move
        if (value) {
            this.hoveredObj = this.getHoveredObj();
        } else {
            this.hoveredObj = null;
        }
    }

    /**
     * Whether the selected object is updated automatically when the pointer is activated.
     * In any case, it can be set manually.
     * 
     * Note that the currently selected object remains selected upon setting this to `false`.
     * 
     * @type {boolean}
     */
    selectEnabled = true;

    /**
     * @type {Iterable<TObject>}
     */
    #objects = new Set();

    /**
     * The objects to interact with.
     * 
     * @type {Iterable<TObject>}
     */
    get objects() { return this.#objects; }

    set objects(value) {
        if (this.objects !== value) {
            this.#objects = value;
            this.selectedObj = null;
            this.hoveredObj = null;
        }
    }

    /**
     * The camera of the rendered scene.
     * 
     * @readonly
     * @type {THREE.Camera}
     */
    camera;

    /**
     * The HTML element where the scene is drawn.
     * 
     * @readonly
     * @type {HTMLElement}
     */
    domElement;

    /**
     * A function which returns the intersection data between the given object and ray.
     * The results are sorted from closest to furthest.
     * 
     * @readonly
     * @type {(obj: TObject, raycaster: THREE.Raycaster) => THREE.Intersection[]}
     */
    raycastFunc;

    /**
     * Raycasts the pointer to the rendered scene.
     * 
     * @readonly
     * @type {THREE.Raycaster}
     */
    raycaster = new THREE.Raycaster();

    /**
     * @type {?TObject}
     */
    #hoveredObj = null;

    /**
     * Sets the object being hovered over.
     * 
     * @param {?TObject} value The object to set, or `null` to deselect.
     * @param {boolean} isFromPointer `true` when handling a pointer event; otherwise, `false`.
     */
    #setHoveredObj(value, isFromPointer) {
        const prevHoveredObj = this.hoveredObj;
        if (prevHoveredObj !== value) {
            this.#hoveredObj = value;

            if (prevHoveredObj != null) {
                this.dispatchEvent({
                    type: 'hoverout',
                    object: prevHoveredObj,
                    isFromPointer: isFromPointer,
                });
            }

            if (value != null) {
                if (CollectionUtils.every(this.objects, (e) => e !== value)) {
                    console.warn('This picker does not interact with the object to hover over');
                }

                this.dispatchEvent({
                    type: 'hoverin',
                    object: value,
                    isFromPointer: isFromPointer,
                });
            }
        }
    }

    /**
     * A view of the object that is being hovered over, if any.
     * 
     * Changes to the object are reflected in the view, and vice-versa.
     * 
     * @type {?TObject}
     */
    get hoveredObj() { return this.#hoveredObj; }

    set hoveredObj(value) { this.#setHoveredObj(value, false); }

    /**
     * Whether an object is being hovered over.
     * 
     * @type {boolean}
     */
    get isHoveringObj() { return this.#hoveredObj != null; }

    /**
     * @type {?TObject}
     */
    #selectedObj = null;

    /**
     * Sets the object being selected.
     * 
     * @param {?TObject} value The object to set, or `null` to deselect.
     * @param {boolean} isFromPointer `true` when handling a pointer event; otherwise, `false`.
     */
    #setSelectedObj(value, isFromPointer) {
        const prevSelectedObj = this.selectedObj;
        if (prevSelectedObj !== value) {
            this.#selectedObj = value;

            if (prevSelectedObj != null) {
                this.dispatchEvent({
                    type: 'selectout',
                    object: prevSelectedObj,
                    isFromPointer: isFromPointer,
                });
            }

            if (value != null) {
                if (CollectionUtils.every(this.objects, (e) => e !== value)) {
                    console.warn('This picker does not interact with the object to select');
                }

                this.dispatchEvent({
                    type: 'selectin',
                    object: value,
                    isFromPointer: isFromPointer,
                });
            }
        }
    }

    /**
     * A view of the object that is being selected, if any.
     * 
     * Changes to the object are reflected in the view, and vice-versa.
     * 
     * @type {?TObject}
     */
    get selectedObj() { return this.#selectedObj; }

    set selectedObj(value) { this.#setSelectedObj(value, false); }

    /**
     * Whether an object is selected.
     * 
     * @type {boolean}
     */
    get hasSelectedObj() { return this.#selectedObj != null; }

    /**
     * Creates a new picker for an existing set of objects.
     * 
     * @param {THREE.Camera} camera The camera of the rendered scene.
     * @param {HTMLElement} domElement The HTML element where the scene is drawn.
     * @param {(obj: TObject, raycaster: THREE.Raycaster) => THREE.Intersection[]} raycastFunc
     * A function which returns the intersection data between the given object and ray.
     * The results are sorted from closest to furthest.
     */
    constructor(camera, domElement, raycastFunc) {
        super();

        this.camera = camera;

        this.domElement = domElement;
        this.domElement.style.touchAction = 'none';    // disable touch scroll
        this.domElement.addEventListener('pointermove', (e) => {
            ThreeUtils.updateRaycaster(this.raycaster, this.camera, this.domElement, e);

            if (this.hoverEnabled) {
                this.#setHoveredObj(this.getHoveredObj(), true);
            }
        });
        this.domElement.addEventListener('pointerdown', (e) => {
            if (e.button === 0) {
                if (this.selectEnabled) {
                    this.#setSelectedObj(this.getHoveredObj(), true);
                }
            }
        });

        this.raycastFunc = raycastFunc;
    }

    /**
     * Gets the object which the pointer is currently over, if any.
     * 
     * Note that the raycaster is kept up to date regardless of whether the picker is enabled.
     * 
     * @returns {?TObject} The requested object.
     */
    getHoveredObj() {
        const raycaster = this.raycaster;

        /**
         * @type {?TObject}
         */
        let hoveredObj = null;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const obj of this.objects) {
            const intersects = this.raycastFunc(obj, raycaster);
            if (intersects.length > 0) {
                const distance = intersects[0].distance;
                if (distance < minDistance) {
                    [hoveredObj, minDistance] = [obj, distance];
                }
            }
        }

        return hoveredObj;
    }
}
