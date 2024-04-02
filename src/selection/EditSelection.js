import * as THREE from 'three';
import _ from 'lodash';

import { PointCloud, PointBuffer } from "../pcd";
import { LabelSelection } from "./LabelSelection";
import { MathUtils, ThreeUtils } from "../utils";
import { LabelClass } from './LabelClass';

/**
 * @typedef {{center: THREE.Vector2, radius: number}} Circle
 */

/**
 * @typedef {import('../Scene').DrawMode} DrawMode
 */


/**
 *  * Represents an event dispatched by {@link EditSelection}:
 * `type`: The type (i.e., name) of the event.
 * 
 * @typedef {{
 *  type: 'selection-added' | 'selection-changed',
 *  labelSelection: LabelSelection,
 *  queriedPoints: THREE.Vector3[]
 * }} EditSelectionEvent
 */
export class EditSelection extends THREE.EventDispatcher {
    /**
     * Newly created label selection in the scene.
     * 
     * @type {?LabelSelection}
     */
    #newLabelSelection = null;

    /**
     * construct an instance of this object.
     */
    constructor() {
        super();
    }

    /**
     * Finds points from point cloud in the drawn object in the scene.
     * 
     * @param { Circle | Array<THREE.Vector2>} object The drawn object on the scene.
     * @param {PointCloud} pointCloud The current point cloud in the frame.
     * @returns {Array<THREE.Vector3>} Points found inside the drawn object.
     */
    #queryPointFromPcd(object, pointCloud) {
        return pointCloud.buffer.getCoords().filter((_, i) => {
                const pointNDC = pointCloud.bufferNDC[i];
                if (object instanceof Array ) {
                    return MathUtils.isPointInPolygon(pointNDC, object);
                } else {
                    return MathUtils.isPointInCircle(object.center, object.radius, pointNDC);
                }
        });
    }

    /**
     * Finds points from selected a selection in the drawn object
     * in the scene. 
     * 
     * @param {Circle | Array<THREE.Vector2>} object The drawn object on the scene.
     * @param {LabelSelection} selection The selected label selection in the frame.
     */
    #queryPointFromSelection(object, selection) {
        return selection.points.filter((_, i) => {
            const pointNDC = selection.pointsNDC[i];
            if (object instanceof Array ) {
                return MathUtils.isPointInPolygon(pointNDC, object);
            } else {
                return MathUtils.isPointInCircle(object.center, object.radius, pointNDC);
            }
        });
    }

    /**
     * Creates a Label object selection in the scene. 
     * 
     * @param { Circle | Array<THREE.Vector2>} object The drawn object on the scene.
     * @param {LabelClass} labelClass The selected label class for new selection.
     * @param {PointCloud} pointCloud The current point cloud in the frame.
     */
    async createSelection(object, labelClass, pointCloud) {
        const pointsInObj = this.#queryPointFromPcd(object, pointCloud);
        let selectionPoints = pointsInObj;

        if (selectionPoints?.length > 0) {
            this.#newLabelSelection = new LabelSelection({id: (Math.random() * 100) +5, points: selectionPoints, pointSize: pointCloud.pointSize});

            this.#newLabelSelection.labelClass = labelClass;
            
            this.dispatchEvent({ type: 'selection-added', labelSelection: this.#newLabelSelection, queriedPoints: pointsInObj });
        }

    }

    /**
     * Modifies the selected label selection in the scene 
     * by adding/erasing points into the selection.
     * 
     * 
     * @param { Circle | Array<THREE.Vector2>} object The drawn object on the scene.
     * @param {PointCloud} pointCloud The current point cloud in the frame.
     * @param {LabelSelection} labelSelection The selected label selection in the scene.
     * @param {DrawMode} mode The scene's drawing mode.
     */
    async modifySelection(object, pointCloud, labelSelection, mode) {
        let pointsInObj = null;
        let selectionPoints = null;
        const selectionElement = labelSelection.points;

        switch(mode) {
            case 'add':
                pointsInObj = this.#queryPointFromPcd(object, pointCloud);
                selectionPoints = pointsInObj.concat(selectionElement);
                break;
            case 'erase':
                pointsInObj = this.#queryPointFromSelection(object, labelSelection);
                selectionPoints = ThreeUtils.differenceOfArrays(selectionElement, pointsInObj);
                break;
            default:
                selectionPoints = null;
                pointsInObj = null;
        }

        if (selectionPoints != null) {
            labelSelection.updateSelectionPoints(selectionPoints);

            this.dispatchEvent({ type: 'selection-changed', labelSelection: labelSelection, queriedPoints: pointsInObj });
        }
    }
}