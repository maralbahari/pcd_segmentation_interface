import * as THREE from 'three';

import { DrawingTool } from './DrawingTool';
import { ThreeUtils } from '../utils';

export class Curvature extends DrawingTool {

    /**
     * The type of this drawing tool.
     * 
     * @type {string}
     */
    static toolType = 'curvature';
    
    /**
     * The points representing the drawn curvature.
     * 
     * @type {Array<THREE.Vector2>}
     */
    #vertices = [];
    
    /**
     * The canvas where this object renders on.
     * 
     * @readonly
     * @type {HTMLCanvasElement}
     */
    canvas;
    
    /**
     * The 2d context of this object is drawn.
     * 
     * @type {?CanvasRenderingContext2D}
     */
    #context = null;

    /**
     * Constructs an instance of this object.
     * 
     * @param {HTMLElement} baseElement The HTML element where the scene is drawn.
     * @param {HTMLCanvasElement} canvas The HTML canvas where this object draws in.
     */
    constructor(baseElement, canvas) {
        super(baseElement);

        this.canvas = canvas;
        this.#context = this.canvas.getContext('2d');

        this.baseElement.addEventListener('pointermove', this.onPointerMove);
        this.baseElement.addEventListener('pointerdown', this.onPointerDown);
        this.baseElement.addEventListener('pointerup', this.onPointerUp);

        this.render();
    
    }

    /**
     * updates the view of this object's canvas.
     */
    render() {
        this.canvas.hidden = !this.enabled;
    }

    /**
     * Calculates the pointer coordinates on canvas.
     * 
     * @param {PointerEvent} event The mouse/pointer event.
     * @returns {THREE.Vector2} The pixel coordinates of
     * pointer position on HTML canvas.
     */
    #getClientOffset(event) {
        return ThreeUtils.getPointerPosOnCanvas(event, this.canvas);
    }

    /**
     * Triggered when pointer is moved on this object's base element.
     * 
     * @param {PointerEvent} event The corresponding pointer event.
     */
    onPointerMove = (event) => {
        const { enabled, isDrawing } = this;
        if (!enabled || !isDrawing) return;

        const currentPos = this.#getClientOffset(event);
        this.#vertices.push(currentPos);

        this.#continue(currentPos);
    };

    /**
     * Triggered when the pointer is pressed down on this object's base element.
     * 
     * @param {PointerEvent} event The corresponding pointer event.
     */
    onPointerDown = (event) => {
        const { mode, enabled } = this;
        if (!enabled || mode !== 'draw') return;
        if (event.button !== 0) return;
        if (this.#context === null) return;

        const newCoords = this.#getClientOffset(event);

        this.#vertices.push(newCoords);

        this.isDrawing = true;

        this.#begin(newCoords);
    }

    /**
     * Triggered when the pointer is released this object's base element.
     * 
     * @param {PointerEvent} event The corresponding pointer event.
     */
    onPointerUp = (event) => {
        const { mode, enabled } = this;
        if (!enabled || mode !== 'draw') return;
        if (event.button !== 0) return;
        if (this.#context === null) return;

        this.#context.closePath();
        this.#context.stroke();
    
        this.#end();
    }

    /**
     * Continues drawing on this object's base element.
     * 
     * @param {THREE.Vector2} pointerCoords The current pointer coordinates.
     */
    #continue(pointerCoords) {
        if (this.#context === null) return;


        this.#context.lineTo(pointerCoords.x, pointerCoords.y);
        this.#context.stroke();
    }

    /**
     * Begins drawing on this object's base element.
     * 
     * @param {THREE.Vector2} newCoords The newly registered polygon coordinates.
     */
    #begin(newCoords) {
        if (this.#context === null) return;

        this.#context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.#context.beginPath();          
        this.#context.strokeStyle = "red"; 
        this.#context.lineWidth = 3;

        // this.#context.moveTo(newCoords.x, newCoords.y);

        // this.#context.stroke();
    };

    /**
     * Ends the drawing on this object's base element.
     */
    #end = () => {
        if (this.#context === null) return;

        this.isDrawing = false;

        this.#context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const curveNDC = ThreeUtils.pixelCoordsListToNDC(this.baseElement, this.#vertices);

        this.dispatchEvent({ type: 'end-draw', drawnObject: curveNDC });

        this.#vertices = [];
    }
}