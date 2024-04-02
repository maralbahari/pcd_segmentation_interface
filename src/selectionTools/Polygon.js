
import * as THREE from 'three';
import { ThreeUtils } from '../utils';

import { DrawingTool } from './DrawingTool';

export class Polygon extends DrawingTool {

    /**
     * The type of this drawing tool.
     * 
     * @type {string}
     */
    static toolType = 'polygon';

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
     * The points representing the drawn polygon.
     * 
     * @type {Array<THREE.Vector2>}
     */
    #vertices = [];

    /**
     * Constructs a new instance of this object.
     * 
     * @param {HTMLElement} baseElement The HTML element where the scene is drawn.
     * @param {HTMLCanvasElement} canvas The HTML canvas where this object draws in.
     */
    constructor(baseElement, canvas) {
        super(baseElement);

        this.canvas = canvas;

        this.#context = this.canvas.getContext('2d');

        this.baseElement.addEventListener('pointerdown', this.onPointerDown);
        this.baseElement.addEventListener('pointermove', this.onPointerMove);
        this.baseElement.addEventListener('dblclick', this.#end);

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
     * Whether a coordinates already exist in the polygon vertices.
     * 
     * @param {THREE.Vector2} coords The newly registered coordinates from pointer position.
     * @returns {boolean} Returns true if the coordinate exists in the vertices list.
     */
    #isCoordsExist(coords) {
        return ThreeUtils.isCoordinatesInArray(this.#vertices, coords);
    }

    /**
     * Triggered when pointer is moved on this object's base element.
     * 
     * @param {PointerEvent} event The corresponding pointer event.
     */    
    onPointerMove = (event) => {
        const { enabled, isDrawing } = this;
        if (!enabled || !isDrawing) return;
        const pointerCoords = this.#getClientOffset(event);
        // this.#begin();
        this.#continue(pointerCoords);
    }

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

        this.isDrawing = true;

        const newCoords = this.#getClientOffset(event);
        if(!this.#isCoordsExist(newCoords)) {
            this.#vertices.push(newCoords);

            this.#begin();
        }
    }

    /**
     * Begins drawing on this object's base element
     */
    #begin() {
        if (this.#context === null) return;

        this.#context.beginPath();          
        this.#context.strokeStyle = "red"; 
        this.#context.lineWidth = 3;

        const points = this.#vertices;

        this.#context.moveTo(points[0].x, points[0].y);

        for(let index = 1; index < points.length; index++) {
            this.#context.lineTo(points[index].x, points[index].y);
        }

        this.#context.stroke();
    };

    /**
     * Continues drawing on this object's base element.
     * 
     * @param {THREE.Vector2} pointerCoords The current pointer coordinates.
     */
    #continue(pointerCoords) {
        if (this.#context === null) return;

        const vertices = this.#vertices;
        this.#begin();
        this.#context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.#context.moveTo(vertices[0].x, vertices[0].y);
        this.#context.lineTo(pointerCoords.x, pointerCoords.y);

        this.#context.moveTo(vertices[vertices.length-1].x, vertices[vertices.length-1].y);
        this.#context.lineTo(pointerCoords.x, pointerCoords.y);

        this.#context.stroke();
    }

    /**
     * Ends the drawing on this object's base element.
     */
    #end = () => {
        if (this.#context === null) return;

        this.isDrawing = false;

        this.#context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const polygonNDC = ThreeUtils.pixelCoordsListToNDC(this.baseElement, this.#vertices);

        this.dispatchEvent({ type: 'end-draw', drawnObject: polygonNDC});

        this.#vertices = [];
    }

}
