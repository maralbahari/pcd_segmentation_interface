import { Tensor, InferenceSession } from 'onnxruntime-web';
import { PointCloud } from '../pcd';

/**
 * @typedef {Object} OnnxModelParams
 * @property {string} encoderModelPath The path of the pcd_encoder.onnx file.
 * @property {string} decoderModelPath The path of the mask_decoder.onnx file.
 */

/**
 * @typedef {import('onnxruntime-web').OnnxValue} OnnxValue
 */


/**
 * @typedef {Object} EncoderFeed
 * @property {OnnxValue} pcd The input pcd to encode. 
 */

/**
 * @typedef {Object} EncoderOutputMap
 * @property {OnnxValue} pcdEmbeddigs The input pcd to encode.
 * @property {OnnxValue} pcdCenter The center pos.
 */

/**
 * @typedef {Object} DecoderFeed
 * @property {OnnxValue} pcdEmbeddings The embedded pcd. 
 * @property {OnnxValue} pointPrompts The points to prompt the decoder.
 * @property {OnnxValue} pointLabel The labels of the point prompts.
 * @property {OnnxValue} pcd The raw input pcd
 * @property {OnnxValue} pcdCenter the center of the input pcd.
 */


/**
 *  a class that would interact with AI model
 */
export class SegmentPcd {
    /**
     * @type {PointCloud}
     */
    #pcd;

    /**
     * @type {PointCloud}
     */
    get pcd() { return this.#pcd; }

    set pcd(value) {
        if (value != null) {
            this.#pcd = value;

            this.#embedPcd();
        }
    }

    /**
     * @type {Number}
     */
    #threshold;

    /**
     * @type {Number}
     */
    get threshold() { return this.#threshold; }

    set threshold(value) {
        if (this.threshold !== value) {
            this.#threshold = value;
        }
    } 

    /**
     * @type {InferenceSession}
     */
    #decoderSession;

    /**
     * @type {InferenceSession}
     */
    #encoderSession;

    /**
     * @type {?OnnxValue}
     */
    #pcdEmbeddings = null;

    /**
     * @type {?OnnxValue}
     */
    #pcdCenter = null;

    async #embedPcd() {
        const pcdTensor = new Tensor("float32", this.pcd.buffer.data, [this.pcd.buffer.numPoints,3]);

        /**
         * @type {EncoderFeed}
         */
        const inputFeed = {
            'pcd': pcdTensor
        };

        await this.#encoderSession.run(inputFeed).then((outputMap) => {
            this.#pcdEmbeddings = outputMap['pcdEmbeddigs'];
            this.#pcdCenter = outputMap['pcdCenter'];
        }).catch((reason) => {
            console.warn(reason);
        });

    }

    /**
     * @param {OnnxModelParams} params The parameters to initialize an onnx session.
     */
    constructor(params) {
        this.#setupSessions(params);
    }

    /**
     * @param {OnnxModelParams} params The parameters to initialize an onnx session.
     */
    async #setupSessions(params) {
        this.#encoderSession = await InferenceSession.create(params.encoderModelPath);
        this.#decoderSession = await InferenceSession.create(params.decoderModelPath);
    }

    /**
     * 
     * @param {Float32Array} points 
     * @param {Float32Array} labels 
     * 
     * @returns {Promise<?Int16Array>}
     */
    async predict(points, labels) {
        const pcdTensor = new Tensor("float32", this.pcd.buffer.data, [this.pcd.buffer.numPoints,3]);
        const pointPrompts = new Tensor("float32", points, [points.length,3]);
        const labelPrompts = new Tensor('float32', labels, [points.length, 3]);

        if (this.#pcdEmbeddings == null || this.#pcdCenter == null) return null;

        /**
         * @type {DecoderFeed}
         */
        const inputFeed = {
            'pcdEmbeddings': this.#pcdEmbeddings,
            'pointPrompts': pointPrompts,   
            'pointLabel': labelPrompts,         
            'pcd': pcdTensor,
            'pcdCenter': this.#pcdCenter,
        };

        return await this.#decoderSession.run(inputFeed).then((outputMap) => {
            if (outputMap['masks'] instanceof(Int16Array)) {
                return outputMap['masks'];
            } else {
                return null;
            }
        }).catch((reason) => {
            console.warn(reason);
            return null;
        });
    }
}