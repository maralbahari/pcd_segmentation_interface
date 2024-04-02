import * as THREE from 'three';

import { DrawingTool } from './DrawingTool';
import { ThreeUtils } from '../utils';

export class RectangleBox extends DrawingTool {

    /**
     * The type of this drawing tool.
     * 
     * @readonly
     * @type {string}
     */
    static toolType = 'box';

    /**
     * The start coordinates position of the drawn rectangle box.
     * 
     * @type {THREE.Vector2}
     */
    startPos = new THREE.Vector2(0, 0);

    /**
     * The end coordinates position of the drawn rectangle box.
     * 
     * @type {THREE.Vector2}
     */
    endPos = new THREE.Vector2(0, 0);

    /**
     * The points representing the drawn rectangle box.
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
     * @type {?CanvasRenderingContext2D}
     */
    #context;

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
        console.log(canvas);
        this.canvas.addEventListener('pointermove', this.onPointerMove);
        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        this.canvas.addEventListener('pointerup', this.onPointerUp);

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
     * @param {PointerEvent} event The corresponding pointer event.
     * @returns {THREE.Vector2} The pixel coordinates of
     * pointer position on HTML canvas.
     */
    #getClientOffset(event) {
        return ThreeUtils.getPointerPosOnCanvas(event, this.canvas);
    }

    /**
     * Arranges the box points counter clock-wise.
     */
    #setBoxCoords() {
        const { startPos, endPos } = this;

        this.#vertices.push(startPos);

        const bottomLeft = new THREE.Vector2(startPos.x, endPos.y);

        this.#vertices.push(bottomLeft);

        this.#vertices.push(endPos);

        const upperRight = new THREE.Vector2(endPos.x, startPos.y);

        this.#vertices.push(upperRight);
    }

    /**
     * Triggered when pointer is moved on this object's base element.
     * 
     * @param {PointerEvent} event The corresponding event.
     */
    onPointerMove = (event) => {
        const { enabled, isDrawing } = this;
        if (!enabled || !isDrawing) return;
        if (this.#context === null) return;

        this.endPos = this.#getClientOffset(event);

        const { endPos, startPos, canvas } = this;

        const width = endPos.x - startPos.x;
        const height = endPos.y - startPos.y;

        this.#context.clearRect(0, 0, canvas.width, canvas.height);
        
        this.#begin(width, height);

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

        this.startPos = this.#getClientOffset(event);
        this.isDrawing = true;
        this.start();
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

        this.#end();
    }

    start() {
        if (this.#context === null) return;
        this.#context.beginPath();
        this.#context.strokeStyle = "red"; 
        this.#context.lineWidth = 3;
    }

    /**
     * Begins drawing on this object's base element.
     * 
     * @param {number} width 
     * @param {number} height 
     */
    #begin(width, height) {
        const { startPos } = this;
        if (this.#context === null) return;

        this.#context.rect(startPos.x, startPos.y, width, height);
        this.#context.stroke();

        this.dispatchEvent({ type: `begin-draw`});
    };

    /**
     * Ends the drawing on this object's base element.
     */
    #end() {
        if (this.#context === null) return;

        this.isDrawing = false;

        this.#setBoxCoords();

        this.#context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const boxNCD = ThreeUtils.pixelCoordsListToNDC(this.baseElement, this.#vertices);

        this.dispatchEvent({ type: `end-draw`, drawnObject: boxNCD});

        this.#vertices = [];
    }
}