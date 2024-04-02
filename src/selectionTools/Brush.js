
import * as THREE from 'three';

import { DrawingTool } from './DrawingTool';
import { ThreeUtils } from '../utils';

/**
 * Represents the circular brush by defining center and radius of the Circle.
 * 
 * @typedef {{center: THREE.Vector2, radius: number}} Circle
 */

export class Brush extends DrawingTool {
    
    /**
     * The type of this drawing tool.
     * 
     * @type {string}
     */
    static toolType = 'brush';

    /**
     * The type of this tool.
     * 
     * @type {string}
     */
    get toolType() { return Brush.toolType; }

    /**
     * the diameter of the brush
     * 
     * @type {number}
     */
    #diameter = 40;

    get diameter() { return this.#diameter; }

    set diameter(value) {
        if (this.diameter !== value) {
            this.#diameter = value;
            this.render();
        }
    }

    /**
     * Represents the dom element of this object.
     * Displays a circular div.
     * 
     * @readonly
     * @type {HTMLElement}
     */
    cursor;

    /**
     * @param {HTMLElement} baseElement The base html element where a drawing tool is used.
     */
    constructor(baseElement) {
        super(baseElement);

        this.cursor = document.createElement('div');
        this.cursor.className = 'brush'; 

        baseElement.addEventListener('pointermove', this.onPointerMove);
        baseElement.addEventListener('pointerdown', this.onPointerDown);
        baseElement.addEventListener('pointerup', this.onPointerUp);

        this.render();

    }

    /**
     * updates the view of this object's cursor element.
     */
    render ()  {
        this.cursor.hidden = !this.enabled;
        this.cursor.style.height = this.diameter+'px'; 
        this.cursor.style.width = this.diameter+'px';
    }

    /**
     * Triggered when pointer is moved on this object's base element.
     * 
     * @param {PointerEvent} event
     */
    onPointerMove = (event) => {
        if (!this.enabled) return;
        this.cursor.style.top = `${event.clientY - this.diameter / 2}px`;
        this.cursor.style.left = `${event.clientX - this.diameter / 2}px`;

        if (this.isDrawing) {
            this.#begin();
        }
    };

    /**
     * Triggered when the pointer is pressed down on this object's base element.
     * 
     * @param {PointerEvent} event
     */
    onPointerDown = (event) => {
        const { mode, enabled } = this;
        if (!enabled || mode !== 'draw') return;
        if (event.button !== 0) return;

        this.isDrawing = true;
    };

    /**
     * Triggered when the pointer is released on this object's base element.
     * 
     * @param {PointerEvent} event
     */
    onPointerUp = (event) => {
        if (!this.enabled) return;
        if (event.button !== 0) return;

        this.#end();
    };
    
    /**
     * Begins painting.
     */
    #begin() {

        const rect = this.cursor.getBoundingClientRect();
        const center = new THREE.Vector2((rect.right + rect.left)/2, (rect.top + rect.bottom)/2);
        const topMid = new THREE.Vector2((rect.right + rect.left)/2, rect.top);

        const centerNDC = ThreeUtils.pixelCoordsToNDC(this.baseElement, center);
        const topMidNDC = ThreeUtils.pixelCoordsToNDC(this.baseElement, topMid);

        const radius = topMidNDC.distanceTo(centerNDC);

        this.dispatchEvent({ type: `begin-draw`, drawnObject: {center: centerNDC, radius} });

    }

    /**
     * Ends the painting.
     */
    #end() {
        this.isDrawing = false;
    }

}