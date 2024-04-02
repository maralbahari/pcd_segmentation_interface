import _ from 'lodash';

/**
 * A range input where the user could set a numeric value through a slider or an input box.
 */
export class RangeInput {

    /**
     * The DOM of this object.
     * 
     * @readonly
     * @type {HTMLDivElement}
     */
    dom;

    /**
     * The label of this widget.
     * 
     * @readonly
     * @type {HTMLLabelElement}
     */
    #label;

    /**
     * @type {string}
     */
    #title;

    /**
     * The title of this range input.
     * 
     * @type {string}
     */
    get title() { return this.#title; }

    set title(value) {
        if (this.#title !== value) {
            this.#title = value;

            this.#label.textContent = value;
        }
    }

    /**
     * The slider of this range input.
     * 
     * @readonly
     * @type {HTMLInputElement}
     */
    #slider;

    /**
     * The input box of this range input.
     * 
     * @readonly
     * @type {HTMLInputElement}
     */
    #inputBox;

    /**
     * @type {number}
     */
    #min;

    /**
     * The minimum allowed value in both inputs.
     * 
     * @type {number}
     */
    get min() { return this.#min; }

    set min(value) {
        if (this.min !== value) {
            this.#min = value;

            const strVal = value.toString();
            this.#slider.min = strVal;
            this.#inputBox.min = strVal;
        }
    }

    /**
     * @type {number}
     */
    #max;

    /**
     * The maximum allowed value in both inputs.
     * 
     * @type {number}
     */
    get max() { return this.#max; }

    set max(value) {
        if (this.max !== value) {
            this.#max = value;

            const strVal = value.toString();
            this.#slider.max = strVal;
            this.#inputBox.max = strVal;
        }
    }

    /**
     * @type {number}
     */
    #step;

    /**
     * The step stored in both inputs.
     * 
     * @type {number}
     */
    get step() { return this.#step; }

    set step(value) {
        if (this.step !== value) {
            this.#step = value;

            const strVal = value.toString();
            this.#slider.step = strVal;
            this.#inputBox.step = strVal;
        }
    }

    /**
     * @type {number}
     */
    #value;

    /**
     * The value stored in both inputs.
     * 
     * Note that `onChange` is not called when the value is set programatically.
     * 
     * @type {number}
     */
    get value() { return this.#value; }

    set value(value) {
        if (this.value !== value) {
            const clampedValue = _.clamp(value, this.min, this.max);

            this.#value = clampedValue;

            const strVal = clampedValue.toString();
            this.#slider.value = strVal;
            this.#inputBox.value = strVal;
        }
    }

    /**
     * @type {boolean}
     */
    #disabled = true;

    /**
     * Whether the inputs are disabled.
     * 
     * @type {boolean}
     */
    get disabled() { return this.#disabled; }

    set disabled(value) {
        if (this.disabled !== value) {
            this.#disabled = value;

            this.#slider.disabled = value;
            this.#inputBox.disabled = value;
        }
    }

    /**
     * A callback which is invoked with the value in the input whenever a change is
     * committed by the user.
     * 
     * It is not invoked when the value is changed programatically.
     * 
     * @type {?((value: number) => void)}
     */
    onchange = null;

    /**
     * Creates a new range input.
     * 
     * @param {string} title The title of the range input.
     * @param {{min?: number, max?: number, step?: number, value?: number}} inputAttrs 
     * The minimum, maximum, step, and current value of the range input. (Optional)
     */
    constructor(title, inputAttrs = {}) {
        this.dom = document.createElement('div');
        this.dom.className = 'range-input';


        this.#label = document.createElement('label');
        this.dom.appendChild(this.#label);

        this.#slider = document.createElement('input');
        this.#slider.type = 'range';
        this.#slider.addEventListener('input', (e) => {
            const target = e.target;
            if (target instanceof HTMLInputElement) {
                this.#inputBox.value = target.value;
            } else {
                throw new Error('The event target has incorrect type');
            }
        });
        this.#slider.addEventListener('change', (e) => {
            this.#onInputChange(e);
        });
        this.dom.appendChild(this.#slider);

        this.#inputBox = document.createElement('input');
        this.#inputBox.type = 'number';
        this.#inputBox.addEventListener('change', (e) => {
            this.#onInputChange(e);
        });
        // this.dom.appendChild(this.#inputBox);

        this.title = title;

        if (inputAttrs.min != null) {
            this.min = inputAttrs.min;
        }
        if (inputAttrs.max != null) {
            this.max = inputAttrs.max;
        }
        if (inputAttrs.step != null) {
            this.step = inputAttrs.step;
        }
        if (inputAttrs.value != null) {
            this.value = inputAttrs.value;
        }

        this.disabled = false;
    }

    /**
     * Handles the event when an alteration to the input's value is
     * committed by the user.
     * 
     * @param {Event} event A description of the event to handle.
     */
    #onInputChange(event) {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            this.value = target.valueAsNumber;
            this.onchange?.(this.value);
        } else {
            throw new Error('The event target has incorrect type');
        }
    }
}
