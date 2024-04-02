import { LabelClass } from "../../selection";

export class ClassInput {

    /**
     * List of label classes as options.
     * 
     * @readonly
     * @type {LabelClass[]}
     */
    labelClasses;

    /**
     * The DOM of this object.
     * 
     * @readonly
     * @type {HTMLDivElement}
     */
    dom;

    /**
     * The drop-down list for picking the labelled object.
     * 
     * @type {HTMLSelectElement}
     */
    #selectElem;

    #recreateSelectOptions = () => {
        let value = this.value;

        this.#selectElem.replaceChildren();

        const labelClasses = this.labelClasses;


        if (labelClasses != null) {
            for (const labelClass of labelClasses) {
                const option = document.createElement('option');

                const text = labelClass.name;
                option.title = text;
                option.textContent = text;
                option.value = labelClass.id.toString();

                this.#selectElem.appendChild(option);
            }
        }

        if (value == null) {
            this.#selectElem.selectedIndex = 0;
            value = this.value;
        }

        this.value = value;
    };

    /**
     * 
     * @type {?((value: ?LabelClass) => void)}
     */
    onchange = null;

    /**
     * Creates a new class selector.
     * 
     * @param {LabelClass[]} labelClasses
     */
    constructor(labelClasses) {
        this.labelClasses = labelClasses;

        this.dom = document.createElement('div');
        this.dom.className = 'class-select';

        this.#selectElem = document.createElement('select');
        this.#selectElem.id = 'classlist';

        this.#selectElem.addEventListener('change', () => {
            this.onchange?.(this.value);
        });

        this.dom.append(this.#selectElem);

        this.#recreateSelectOptions();
    }

    /**
     * The class that is selected.
     * 
     * @type {?LabelClass}
     */
    get value() {
        const classId = this.#selectElem.value;
        const labelClasses = this.labelClasses;
        return labelClasses.find((value) => value.id === Number(classId))?? null;
    }

    set value(value) {
        if (value != null) {
            this.#selectElem.value = value?.id.toString();
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

            this.#selectElem.disabled = this.disabled;
        }
    }
}
