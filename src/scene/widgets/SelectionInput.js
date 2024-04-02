import { LabelSelection } from "../../selection";
/**
 * @type {string}
 */
const NO_SELECTION_VALUE = '';

export class SelectionInput {

    /**
     * List of label selections as option.
     * 
     * @type {LabelSelection[]}
     */
    selections;

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

    #recreateSelectOption = () => {
        let value = this.value;

        this.#selectElem.replaceChildren();
        {
            const option = document.createElement('option');

            const text = 'No Selection';
            option.title = text;
            option.textContent = text;
            option.value = NO_SELECTION_VALUE;

            this.#selectElem.appendChild(option);
        }

        const selections = this.selections;

        if (selections != null) {
            for (const selection of selections) {
                const option = document.createElement('option');

                const text = `[#${selection.id} (${selection.labelClass.name})]`;
                option.title = text;
                option.textContent = text;
                option.value = selection.id.toString();
                this.#selectElem.appendChild(option);

            }
        }

        // if (value == null) {
        //     {
        //         const option = document.createElement('option');
    
        //         const text = 'No Selection';
        //         option.title = text;
        //         option.textContent = text;
        //         option.value = NO_SELECTION_VALUE;
    
        //         this.#selectElem.appendChild(option);
        //     }            
        //     // value = this.value;
        // }
        this.value = value;
    };

    /**
     * 
     * @type {?((value: ?LabelSelection) => void)}
     */
    onchange = null;

    /**
     * 
     * @param {LabelSelection[]} selections 
     */
    constructor(selections) {
        this.selections = selections;

        this.dom = document.createElement('div');
        this.dom.className = 'selection-list';

        this.#selectElem = document.createElement('select');

        this.#selectElem.addEventListener('change', () => {
            this.onchange?.(this.value);
        });

        this.dom.appendChild(this.#selectElem);

        this.#recreateSelectOption();
    }


    /**
     * The class that is selected.
     * 
     * @type {?LabelSelection}
     */
    get value() {
        const selectionId = this.#selectElem.value;
        const selections = this.selections;
        return selections.find((value) => value.id === Number(selectionId)) ?? null;
    }

    set value(value) {
        if (value != null) {
            this.#selectElem.value = value?.id.toString();
        }
    }

    /**
     * @type {boolean}
     */
    #disabled = false;

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