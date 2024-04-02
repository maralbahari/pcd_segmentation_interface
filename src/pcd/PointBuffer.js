import _ from 'lodash';
import * as THREE from 'three';

import { CoordinateFormat } from '../config';

/**
 * Checks that an inputted number of values used to describe each point in a buffer is valid.
 * 
 * @param {Float32Array} data The input data to contain inside the buffer.
 * @param {number} numChannels The input number of values used to describe each point.
 * @returns {number} The input number of values used to describe each point, or a fallback value.
 */
function checkNumChannels(data, numChannels) {
    if (numChannels < 3) {
        console.error(`The number of channels (${numChannels}) must be >= 3`);

        // Fallback value
        return 3;
    }
    if (data.length % numChannels !== 0) {
        console.error(`The number of channels (${numChannels}) does not evenly divide the data (length: ${data.length})`);

        // Fallback value
        return data.length;
    }

    return numChannels;
}

/**
 * Interprets a flat array as an array of points.
 */
export class PointBuffer {

    /**
     * The data inside this buffer, originating from the project.
     * 
     * @type {Float32Array}
     */
    #data;

    /**
     * The mapping between the coordinate system of the project and that of `three.js`.
     * 
     * @readonly
     * @type {CoordinateFormat}
     */
    format;

    /**
     * The number of values used to describe each point in `data`.
     * 
     * For example, if it contains 3-D points with no additional information, `numChannels === 3`.
     * 
     * @readonly
     * @type {number}
     */
    numChannels;

    /**
     * Checks that an inputted index of a channel is in the range `[0, this.numChannels)`.
     * 
     * @param {number} channelIdx The input index of the channel.
     * @returns {number} The input index of the channel, or a fallback value equal to clamping
     * `channelIdx` to its valid range.
     */
    #checkChannelIdx(channelIdx) {
        if (channelIdx < 0 || channelIdx >= this.numChannels) {
            console.error(`Channel index ${channelIdx} is not in [0, ${this.numChannels})`);

            // Fallback value
            return _.clamp(channelIdx, 0, this.numChannels - 1);
        }

        return channelIdx;
    }

    /**
     * The number of points in this buffer.
     * 
     * @readonly
     * @type {number}
     */
    numPoints;

    /**
     * Checks that an inputted index of a point is in the range `[0, this.numPoints)`.
     * 
     * @param {number} pointIdx The input index of the point.
     * @returns {number} The input index of the point, or a fallback value equal to clamping
     * `pointIdx` to its valid range.
     */
    #checkPointIdx(pointIdx) {
        if (pointIdx < 0 || pointIdx >= this.numPoints) {
            console.error(`Point index ${pointIdx} is not in [0, ${this.numPoints})`);

            // Fallback value
            return _.clamp(pointIdx, 0, this.numPoints - 1);
        }

        return pointIdx;
    }

    /**
     * Creates a new buffer object containing the values of a `three.js` buffer attribute.
     * 
     * @param {THREE.BufferAttribute | THREE.InterleavedBufferAttribute} bufferAttribute The
     * `three.js` buffer attribute.
     * @param {CoordinateFormat} format The mapping between the coordinate system of the project
     * and that of `three.js`.
     * @returns {PointBuffer} The resulting buffer object.
     */
    static fromBufferAttribute(bufferAttribute, format) {
        if (!(bufferAttribute instanceof THREE.Float32BufferAttribute)) {
            throw new Error('Only float32 attributes are supported');
        }
        if (bufferAttribute.itemSize !== 3) {
            throw new Error('Only Vector3 attributes are supported');
        }
        const arr = new Float32Array(bufferAttribute.array);
        return new PointBuffer(arr, format, 3);
    }

    /**
     * Creates a new buffer object from a list of `three.js` vector3 object.
     * 
     * @param {?THREE.Vector3[]} coordArray The array of containing coordinates.
     * @param {CoordinateFormat} format The project's coordinate format.
     */
    static fromVec3Array(coordArray, format) {
        if (!(coordArray instanceof Array)) {
            throw new Error('Only array of Vector3 are supported');
        }

        const bufferGeo = new THREE.BufferGeometry().setFromPoints(coordArray);
        return this.fromBufferAttribute(bufferGeo.getAttribute('position'), format);
    }

    /**
     * Creates a new buffer object with the provided data and metadata.
     * 
     * @param {Float32Array} data The data to contain inside the buffer. No copy is made.
     * It should originate from the project rather than `three.js`.
     * @param {CoordinateFormat} format The mapping between the coordinate system of the project
     * and that of `three.js`.
     * @param {number} numChannels The number of values used to describe each point in `data`.
     */
    constructor(data, format, numChannels) {
        const cleanedNumChannels = checkNumChannels(data, numChannels);

        this.#data = data;
        this.format = format;
        this.numChannels = cleanedNumChannels;
        this.numPoints = data.length / cleanedNumChannels;
    }

    /**
     * Obtains each channel of a point by index.
     * 
     * @param {number} pointIdx The index of the point, in the range `[0, this.numPoints)`.
     * @returns {Float32Array} The `i`th element represents the `i`th channel of the given point.
     */
    getPoint(pointIdx) {
        const cleanedPointIdx = this.#checkPointIdx(pointIdx);

        const numChannels = this.numChannels;
        return this.#data.slice(numChannels * cleanedPointIdx, numChannels * (cleanedPointIdx + 1));
    }

    /**
     * Obtains the `three.js` coordinates of a point by index.
     * 
     * @param {number} pointIdx The index of the point, in the range `[0, this.numPoints)`.
     * @returns {THREE.Vector3} The coordinates of the given point.
     */
    getPointCoords(pointIdx) {
        const [a, b, c] = this.getPoint(pointIdx);
        return this.format.toThreeJSCoords(new THREE.Vector3(a, b, c));
    }

    /**
     * For each point, obtains its `three.js` coordinates.
     * 
     * @returns {THREE.Vector3[]} The `i`th element represents the coordinates of the `i`th point.
     */
    getCoords() {
        return _.range(this.numPoints).map((i) => this.getPointCoords(i));
    }

    /**
     * For each point, obtains the value of a channel by index.
     * 
     * @param {number} channelIdx The index of the channel, in the range `[0, this.numChannels)`.
     * @returns {number[]} The `i`th element represents the given channel of the `i`th point.
     */
    getChannel(channelIdx) {
        const cleanedChannelIdx = this.#checkChannelIdx(channelIdx);

        const data = this.#data;
        const numChannels = this.numChannels;
        return _.range(this.numPoints).map((i) => data[i * numChannels + cleanedChannelIdx]);
    }

    /**
     * Creates a deep copy of this buffer.
     * 
     * @returns {PointBuffer} The newly created copy.
     */
    clone() {
        return new PointBuffer(this.#data.slice(), this.format, this.numChannels);
    }
}
