import { ClassInput } from '../scene/widgets';
import { DraggablePanel } from '../widgets' 
import { LabelClass } from './LabelClass';

export class LabelClassSelector {

    /**
     * The input selector with label classes as its option.
     * 
     * @type {ClassInput}
     */
    #classInput;

    /**
     * The draggable panel of this object.
     * 
     * @type {DraggablePanel}
     */
    panel;

    /**
     * Constructs an instance of this object.
     * 
     * @param {LabelClass[]} labelClasses list of label classes in the frame.
     */
    constructor(labelClasses) {
        const dom = document.createElement('div');
        dom.className = 'class-selector';
        {
            const label = document.createElement('label');
            label.textContent = 'Classes';
            dom.appendChild(label);

            this.#classInput = new ClassInput(labelClasses);

            dom.appendChild(this.#classInput.dom);
        }

        this.panel = new DraggablePanel('Dataset Labels', dom);
    }
    /**
     * The selected label class.
     * 
     * @type {?LabelClass}
     */
    get selectedClass() {
        return this.#classInput.value;
    }
}