import { Scene } from "../Scene";

export class Hint {
    /**
     * The dom of this object.
     * 
     * @type {HTMLElement}
     */
    dom;

    /**
     * The span element of this object.
     * 
     * @type {HTMLSpanElement}
     */
    #hint;

    /**
     * @type {?Scene}
     */
    #scene = null;

    /**
     * The active scene.
     * 
     * @type {?Scene}
     */
    get scene() { return this.#scene; }

    set scene(value) {
        if (this.scene != value) {
            this.#scene = value;
        }
    }

    /**
     * The message to be displayed as hint.
     * 
     * @type {String}
     */
    #reminder = '';

    /**
     * Constructs an instance of this object.
     */
    constructor() {
        this.dom = document.createElement('div');
        this.dom.className = 'top-mid'
        {
            this.#hint = document.createElement('span');
            this.#hint.className = 'hint';
        }
        this.dom.appendChild(this.#hint);
    }

    /**
     * Updates the view of this object.
     */
    render() {
        const scene = this.scene;
        if (scene == null) {
            this.#reminder = 'Wrong configuration data';
        } else {
            const { interactMode, drawMode, selectedToolType, hasSelectedTool, hasSelectedSelection, isDrawing } = scene;
            if (hasSelectedSelection && hasSelectedTool) {
                if (drawMode === 'erase') {
                    this.#reminder = 'Press [D] to add points to the selection, or Press [Esc] to cancel.'
                } else {
                    this.#reminder = 'Press [E] to erase points from the selection, or Press [Esc] to cancel.'
                }
            } else if (hasSelectedSelection && !hasSelectedTool) {
                this.#reminder = 'Select a tool to begin drawing, or [Del] to delete a selection'
            } else {
                switch(interactMode) {
                    case 'draw':
                        if (isDrawing) {
                            switch(selectedToolType) {
                                case 'polygon':
                                    this.#reminder = 'Double click the pointer to finish drawing, or Press [Esc] to cancel.'
                                    break;
                                case 'selector':
                                    this.#reminder = 'Hover and click on a selection, or Press [Esc] to cancel.'
                                    break;
                                default:
                                    this.#reminder = 'Release the pointer to finish drawing, or Press [Esc] to cancel.'
                            }
                        } else {
                            this.#reminder = 'Press left pointer to begin drawing.'
                        }
                        break;
                    case 'navigate':
                        this.#reminder = 'Press [S] to select a selection, or select a tool to add a new selection.'
                        break;
                    case 'select':
                        this.#reminder = 'Hover and click on a selection. or Press [Esc] to cancel.'
                        break;
                    default:
                }
            }

            this.#hint.innerHTML = `${this.#reminder.replaceAll('[', '<kbd>').replaceAll(']', '</kbd>')}`;
        }

    }

}