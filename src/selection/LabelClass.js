import * as THREE from 'three';

export class LabelClass {
    
    /**
     * The unique identifier of the object class.
     * 
     * @readonly
     * @type {number}
     */
    id;

    /**
     * The display name of the object class.
     * 
     * @readonly
     * @type {string}
     */
    name;

    /**
     * The color of a bounding box annotated with this class.
     * 
     * @readonly
     * @type {Readonly<THREE.Color>}
     */
    color;

    /**
     * Creates a new type of labelled object for a detection model.
     * 
     * @param {number} id The unique identifier of the object class.
     * @param {string} name The display name of the object class.
     * @param {THREE.ColorRepresentation} color The color of an annotated selection.
     */
    constructor(id, name, color) {
        this.id = id;
        this.name = name;

        this.color = new THREE.Color(color);

        Object.freeze(this);
    }

}