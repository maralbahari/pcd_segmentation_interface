import _ from 'lodash';
import * as THREE from 'three';

import * as MathUtils from './MathUtils';
import { PointBuffer, PointCloud } from '../pcd';
import { LabelSelection } from '../selection';
import { CoordinateFormat } from '../config';

/**
 * @typedef {import('../Scene').DrawMode} DrawMode
 */

/**
 * The threshold used to check if a value is close enough to zero.
 * 
 * @type {number}
 */
export const EPSILON = 1e-07;

/**
 * Checks if two numbers are close to each other, i.e., the absolute difference between them is
 * equal to or less than a threshold.
 * 
 * @param {number} a The first number to compare.
 * @param {number} b The second number to compare.
 * @param {number} tol The tolerance threshold, which defaults to {@link EPSILON}.
 * @returns {boolean} `true` if the two numbers are close to each other; otherwise, `false`.
 */
export function isAbsClose(a, b, tol = EPSILON) {
    return Math.abs(a - b) <= tol;
}

/**
 * Checks if two numbers are close to each other, i.e., the relative difference between them is
 * equal to or less than a threshold.
 * 
 * @param {number} a The first number to compare.
 * @param {number} b The second number to compare.
 * @param {number} tol The tolerance threshold, which defaults to {@link EPSILON}.
 * @returns {boolean} `true` if the two numbers are close to each other; otherwise, `false`.
 */
export function isRelClose(a, b, tol = EPSILON) {
    return (1 - tol) * b <= a && a <= (1 + tol) * b;
}

/**
 * Applies a function to each element of a vector, modifying it in-place.
 * 
 * @param {THREE.Vector3} v The vector to modify.
 * @param {(value: number) => number} fn The function to apply.
 * @returns {THREE.Vector3} The modified input vector.
 */
export function mapVector3(v, fn) {
    return v.setX(fn(v.x)).setY(fn(v.y)).setZ(fn(v.z));
}

/**
 * Applies a function to each element of a pair of vectors, resulting in a new vector.
 * 
 * @param {THREE.Vector3} v1 The first vector in the pair.
 * @param {THREE.Vector3} v2 The second vector in the pair.
 * @param {(value1: number, value2: number) => number} fn The function to apply.
 * @returns {THREE.Vector3} The new vector.
 */
export function zipVector3(v1, v2, fn) {
    return new THREE.Vector3(fn(v1.x, v2.x), fn(v1.y, v2.y), fn(v1.z, v2.z));
}

/**
 * Computes the element-wise sum of one or more matrices.
 * 
 * @param {THREE.Matrix3} mat The first matrix.
 * @param {...THREE.Matrix3} mats The other matrices.
 * @returns {THREE.Matrix3} The output matrix.
 */
export function sumMatrix3(mat, ...mats) {
    const result = new THREE.Matrix3().multiplyScalar(0);
    const resultElements = result.elements;

    for (const m of [mat, ...mats]) {
        m.elements.forEach((e, i) => {
            MathUtils.assertIsNumeric(e);

            resultElements[i] += e;
        });
    }

    return result;
}

/**
 * Sets the attributes for a `three.js` geometry from an array of normals.
 * 
 * @param {THREE.BufferGeometry} geometry The geometry the update.
 * @param {THREE.Vector3[]} normals A dense array containing the normals to assign.
 * @returns {THREE.BufferGeometry} The modified geometry.
 */
export function setFromNormals(geometry, normals) {
    const normal = [];

    for (let i = 0, l = normals.length; i < l; i++) {
        const c = normals[i];
        normal.push(c.x, c.y, c.z);
    }

    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));

    return geometry;
}

/**
 * Sets the attributes for a `three.js` geometry from an array of colors.
 * 
 * @param {THREE.BufferGeometry} geometry The geometry the update.
 * @param {THREE.Color[]} colors A dense array containing the colors to assign.
 * @returns {THREE.BufferGeometry} The modified geometry.
 */
export function setFromColors(geometry, colors) {
    const color = [];

    for (let i = 0, l = colors.length; i < l; i++) {
        const c = colors[i];
        color.push(c.r, c.g, c.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));

    return geometry;
}

/**
 * Checks whether vector coordinates exists in an array.
 * 
 * @param {THREE.Vector3[] | THREE.Vector2[]} array The given array for search.
 * @param {THREE.Vector3 | THREE.Vector2} point The desired point to search for.
 * @returns {boolean} returns true if the point exist in the array.
 */
export function isCoordinatesInArray(array, point) {
    // @ts-ignore
    return array.some((vec) => vec.equals(point));
}

/**
 * Finds the difference of two arrays.
 * 
 * @param {Array<THREE.Vector3>} arrA first array.
 * @param {Array<THREE.Vector3>} arrB second array.
 * @returns {Array<THREE.Vector3>} the resulting array.
 */
export function differenceOfArrays(arrA, arrB) {
    return arrA.filter((point) => !isCoordinatesInArray(arrB, point));
}

/**
 * Filters points of label selections from point cloud in the frame.
 * 
 * @param {PointCloud} pointCloud The point cloud in the frame.
 * @param {THREE.Vector3[]} points The edited label selection in the frame.
 * @param {DrawMode} mode The draw mode in the scene.
 * @returns {?PointCloud} The resulted filtered point cloud.
 */
export function filterPointCloud(pointCloud, points, mode) {
    let filteredPoints = null;
    switch(mode) {
        case 'add':
            filteredPoints = differenceOfArrays(pointCloud.buffer.getCoords(), points);
            break;
        case 'erase':
            filteredPoints = pointCloud.buffer.getCoords().concat(points);
            break;
        default:
    }
    const pointBuffer = PointBuffer.fromVec3Array(filteredPoints, CoordinateFormat.XYZ);
    return  new PointCloud(pointBuffer, pointCloud.pointSize);
}

/**
 * Gets the normalized device coordinates of the pointer when an event is fired.
 * 
 * @param {HTMLElement} domElement The HTML element which the event was fired from.
 * @param {PointerEvent} event The event being fired.
 * @returns {{x: number, y: number}} The normalized device coordinates.
 */
export function getPointerNDC(domElement, event) {
    if (domElement.ownerDocument.pointerLockElement) {
        return { x: 0, y: 0 };
    }

    const rect = domElement.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    };
}

/**
 * Calculates the point cloud coordinates of the current scene into camera space.
 * or (normalized device coordinates).
 * 
 * @param {THREE.Vector3[]} points The list of world point coordinates.
 * @param {THREE.Camera} camera The camera of the current scene.
 * @returns {THREE.Vector3[]} The array of normalized device coordinates.
 */
export function worldCoordsToNDC(points, camera) {
    return points.map((point) => point.clone().project(camera));
}

/**
 * Converts pixel coordinates into normalized device coordinates.
 * 
 * @param {HTMLElement} domElement The parent dom element.
 * @param {THREE.Vector2} coord The pixel coordinates.
 * @returns {THREE.Vector2} The normalized device coordinates.
 */
export function pixelCoordsToNDC(domElement, coord) {
    if (domElement.ownerDocument.pointerLockElement) {
        return new THREE.Vector2(0, 0);
    }

    const rect = domElement.getBoundingClientRect();
    const x = (( coord.x - rect.left) / rect.width) * 2 - 1;
    const y = -(((coord.y - rect.top) / rect.height) * 2 - 1);
    return new THREE.Vector2(x, y);
}

/**
 * Converts pixel coordinates given in an array into normalize device coordinates.
 * 
 * @param {HTMLElement} domElement The parent dom element.
 * @param {Array<THREE.Vector2>} coordsList the list of pixel coordinates.
 * @returns {Array<THREE.Vector2>} The normalized device coordinates of the list.
 */
export function pixelCoordsListToNDC(domElement ,coordsList) {
    return coordsList.map((coord) => pixelCoordsToNDC(domElement, coord));
}

/**
 * Finds the coordinate pixel of the pointer.
 * 
 * @param {PointerEvent} event The triggered pointer event.
 * @param {HTMLCanvasElement} canvas The canvas to calculate the offset.
 * @returns {THREE.Vector2} The pointer position on canvas. 
 */
export function getPointerPosOnCanvas(event, canvas) {
    const { pageX, pageY } = event;

    const x = pageX - canvas.offsetLeft;
    const y = pageY - canvas.offsetTop;

    return new THREE.Vector2(x, y);
}

/**
 * Sets the threshold when raycasting against points.
 * 
 * @param {THREE.Raycaster} raycaster The raycaster to update. It is modified by this method.
 * @param {number} threshold The threshold to set.
 */
export function setRaycasterPointsThreshold(raycaster, threshold) {
    if (raycaster.params.Points == null) {
        // eslint-disable-next-line no-param-reassign
        raycaster.params.Points = { threshold };
    } else {
        // eslint-disable-next-line no-param-reassign
        raycaster.params.Points.threshold = threshold;
    }
}

/**
 * Updates a raycaster according to the position of the pointer when it is moved.
 * 
 * @param {THREE.Raycaster} raycaster The raycaster to update. It is modified by this method.
 * @param {THREE.Camera} camera The camera from which the ray should originate.
 * @param {HTMLElement} domElement The HTML element which the event was fired from.
 * @param {PointerEvent} event The event being fired.
 * @returns {THREE.Raycaster} The updated raycaster.
 */
export function updateRaycaster(raycaster, camera, domElement, event) {
    raycaster.setFromCamera(getPointerNDC(domElement, event), camera);
    return raycaster;
}

/**
 * Checks that an inputted size is non-negative.
 * 
 * @param {number} size The input size.
 * @returns {number} The input size, or a fallback value equal to taking the absolute value of
 * `size`. In the case that the input is {@link NaN}, fallbacks to `0`.
 */
export function checkSize(size) {
    const isnan = Number.isNaN(size);

    if (isnan || size < 0) {
        console.error(`The size must be non-negative. Found: ${size}`);

        // Fallback value
        return isnan ? 0 : -size;
    }

    return size;
}

/**
 * Checks that an inputted opacity is in the range `[0, 1]`.
 * 
 * @param {number} opacity The input opacity.
 * @returns {number} The input opacity, or a fallback value equal to clamping `opacity` to
 * its valid range. In the case that the input is {@link NaN}, fallbacks to `0`.
 */
export function checkOpacity(opacity) {
    const isnan = Number.isNaN(opacity);

    if (isnan || opacity < 0 || opacity > 1) {
        console.error(`The opacity must be in the range [0, 1]. Found: ${opacity}`);

        // Fallback value
        return isnan ? 0 : _.clamp(opacity, 0, 1);
    }

    return opacity;
}
