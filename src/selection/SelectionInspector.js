import * as THREE from 'three';

import { SelectionInput, ClassInput } from "../scene/widgets";
import { DraggablePanel } from "../widgets";
import { LabelClass } from "./LabelClass";
import { LabelSelection } from "./LabelSelection";
/**
 * Represents an event dispatched by {@link SelectionInspector}
 * 
 * @typedef {{ type: 'selectedSelection-changed' | 'classify',
 *  selection?: LabelSelection,
 *  labelClass?: LabelClass,
 * }} SelectionInspectorEvent
 */
export class SelectionInspector extends THREE.EventDispatcher {

    /**
     * The label class selector.
     * 
     * @type {ClassInput}
     */
    #classInput;

    /**
     * The label selection selector.
     * 
     * @type {SelectionInput}
     */
    #selectionInput;

    /**
     * The draggable panel of this object.
     * 
     * @type {DraggablePanel}
     */
    panel;

    /**
     * @type {boolean}
     */
    #enabled = true;

    /**
     * Whether the user can edit selections.
     * 
     * @type {boolean}
     */
    get enabled() { return this.#enabled; }

    set enabled(value) {
        if (this.enabled !== value) {
            this.#enabled = value;

            this.render();
        }
    }

    /**
     * The selected label selection.
     * 
     * @type {?LabelSelection}
     */
    get selectedSelection() { return this.#selectionInput.value; }

    set selectedSelection(value) {
        if (this.selectedSelection !== value) {
            this.#selectionInput.value = value;

            this.#handleSelectedSelectionChanged();

        }

    }

    /**
     * to notify the event of selection change.
     */
    #handleSelectedSelectionChanged = () => {
        this.dispatchEvent({ type: 'selectedSelection-changed', selection: this.selectedSelection });

        this.render();
    };

    /**
     * The selected label class of the selected selection.
     * 
     * @type {?LabelClass}
     */
    get selectedClass() {
        return this.#classInput.value;
    }

    /**
     * Constructs an instance of this object.
     * 
     * @param {LabelSelection[]} selections 
     * @param {LabelClass[]} labelClasses 
     */
    constructor(selections, labelClasses) {
        super();

        const dom = document.createElement('div');
        dom.className = 'selection-inspector';
        {   
            const selectionLabel =  document.createElement('label');
            selectionLabel.textContent = 'Selection';
            dom.appendChild(selectionLabel);

            this.#selectionInput = new SelectionInput(selections);

            dom.appendChild(this.#selectionInput.dom);

            const classLabel = document.createElement('label');
            classLabel.textContent = 'Class';
            dom.appendChild(classLabel);

            this.#classInput = new ClassInput(labelClasses);
            this.#classInput.onchange = ((value) => {
                if (this.selectedSelection !=null && value !=null) {

                    this.dispatchEvent({
                        type: 'classify',
                        selection: this.selectedSelection,
                        labelClass: value
                    });
                }
            });

            dom.appendChild(this.#classInput.dom);
        }

        this.panel = new DraggablePanel('Selections Setting', dom);

        this.render();
    }

    /**
     * Updates the view dom elements of this object.
     */
    render() {
        this.#selectionInput.disabled = !this.enabled;
        this.#classInput.disabled = !this.#enabled;

        if (this.selectedSelection != null) {
            this.#selectionInput.value = this.selectedSelection;
            this.#classInput.value = this.selectedSelection.labelClass;
        }
    }
}