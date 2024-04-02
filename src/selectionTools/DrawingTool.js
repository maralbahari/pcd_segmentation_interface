import * as THREE from 'three';

/**
 * @typedef {import('../Scene').InteractMode} Mode
 */

/**
 * @typedef {import('./Brush').Circle} Circle
 */

/**
 * Represents an event dispatched by {@link DrawingTool}:
 * 
 * @typedef {{
 *     type: 'begin-draw' | 'end-draw',
 *     drawnObject: Array<THREE.Vector2> | Circle      
 * }} DrawingToolEvent
*/
export class DrawingTool extends THREE.EventDispatcher {

    /**
     * The type of this tool.
     * 
     * @type {string}
     * @abstract
     */
    get toolType() { throw new Error('Not implemented'); }

    /**
     * The dom where the tool is being appended.
     * 
     * @readonly
     * @type {HTMLElement}
     */
    baseElement;

    /**
     * @type {Mode}
     */
    #mode = 'navigate';

    /**
     * the cursor mode of the scene.
     */
    get mode() { return this.#mode; }

    set mode(value) {
        if(this.mode !== value) {
            this.#mode = value;
        }
    }

    /**
     * @type {boolean}
     */
    #enabled = false;

    /**
     * Whether the user is able to use this object.
     * 
     * @type {boolean}
     */
    get enabled() { return this.#enabled; }

    set enabled(value) {
        if (this.enabled !== value) {
            this.#enabled = value;

            this.render();
        }

    }

    /**
     * @type {boolean}
     */
    #isDrawing = false;

    /**
     * Whether the drawing has began.
     * 
     * @type {boolean}
     */
    get isDrawing() { return this.#isDrawing; }

    set isDrawing(value) {
        if (this.isDrawing !== value) {
            this.#isDrawing = value; 
        }
    }

    /**
     * Constructs an instance of this object.
     * 
     * @param {HTMLElement} baseElement The HTML element where the scene is drawn.
     */
    constructor(baseElement) {
        super();

        this.baseElement = baseElement;
    }

    /**
     * updates the view of this object.
     */
    render() {
        throw new Error('Not implemented');
    }
}