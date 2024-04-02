import { Scene } from '../Scene';
import { RangeInput } from '../widgets/RangeInput';

export class Toolbar {

    /**
     * @readonly
     * @type { Scene }
     */
    scene;

    /**
     * The DOM of this object.
     * 
     * @readonly
     * @type {HTMLDivElement}
     */
    dom;

    /**
     * When clicked, enters select mode.
     * 
     * @readonly
     * @type {HTMLButtonElement}
     */
    #selectButton;

    /**
     * When clicked, enters draw box mode.
     * 
     * @readonly
     * @type {HTMLButtonElement}
     */
    #boxButton;

    /**
     * When clicked, enters draw brush mode.
     * 
     * @readonly
     * @type {HTMLButtonElement}
     */
    #brushButton;

    /**
     * When clicked, enters draw polygon mode.
     * 
     * @readonly
     * @type {HTMLButtonElement}
     */
    #polygonButton;

    /**
     * When clicked, enters draw curvature mode.
     * 
     * @readonly
     * @type {HTMLButtonElement}
     */
    #curvatureButton;

    /**
     * When clicked, enters erase mode.
     * 
     * @readonly
     * @type {HTMLButtonElement}
     */
    #eraseButton;

    /**
     * When clicked, enters draw mode using brush.
     * 
     * @readonly
     * @type {HTMLElement}
     */
    #brushSizeDiv;

    /**
     * Represents a range size for brush diameter.
     * 
     * @readonly
     * @type {RangeInput}
     */
    #brushSizeInput;

    /**
     * Constructs an instance of this object.
     * 
     * @param {Scene} scene The active scene.
     */
    constructor(scene) {
        this.scene = scene;

        scene.addEventListener('interactMode-changed', this.render);
        scene.addEventListener('selectedTool-changed', this.render);
        scene.addEventListener('drawMode-changed', this.render);
        scene.addEventListener('brushSize-changed', this.render);

        this.dom = document.createElement('div');
        this.dom.className = 'scene-toolbar';

        const toolsDiv = document.createElement('div');
        toolsDiv.className = 'btn-group-vertical';
        toolsDiv.style.zIndex = '3';
        {
            this.#selectButton = document.createElement('button');
            this.#selectButton.className = 'btn btn-secondary';
            this.#selectButton.innerHTML = '<i class="bi bi-hand-index-thumb"></i>';
            this.#selectButton.title = 'Select a selection';
            this.#selectButton.setAttribute('data-bs-toggle', 'tooltip');

            toolsDiv.appendChild(this.#selectButton);

            this.#selectButton.addEventListener('click', () => {
                this.setSelect();
            });

            this.#boxButton = document.createElement('button');
            this.#boxButton.className = 'btn btn-secondary';
            this.#boxButton.innerHTML = '<i class="bi bi-square"></i>';
            this.#boxButton.title = 'Draw Rectangle Box';
            this.#boxButton.setAttribute('data-bs-toggle', 'tooltip');

            toolsDiv.appendChild(this.#boxButton);

            this.#boxButton.addEventListener('click', () => {
                console.log('clicked');
                this.setBox();
            });

            this.#polygonButton = document.createElement('button');
            this.#polygonButton.className = 'btn btn-secondary';
            this.#polygonButton.innerHTML = '<i class="bi bi-hexagon"></i>';
            this.#polygonButton.title = 'Draw Polygon';

            toolsDiv.appendChild(this.#polygonButton);

            this.#polygonButton.addEventListener('click', () => {
                this.setPolygon();
            });

            this.#curvatureButton = document.createElement('button');
            this.#curvatureButton.className = 'btn btn-secondary';
            this.#curvatureButton.innerHTML = '<i class="bi bi-vector-pen"></i>';
            this.#curvatureButton.title = 'Draw Curvature';
            this.#curvatureButton.setAttribute('data-bs-toggle', 'tooltip');

            toolsDiv.appendChild(this.#curvatureButton);

            this.#curvatureButton.addEventListener('click', () => {
                console.log('clicked curve')
                this.setCurvature();
            });

            this.#brushButton = document.createElement('button');
            this.#brushButton.className = 'btn btn-secondary';
            this.#brushButton.innerHTML = '<i class="bi bi-brush"></i>';
            this.#brushButton.title = 'Brush';
            this.#brushButton.setAttribute('data-bs-toggle', 'tooltip');

            toolsDiv.appendChild(this.#brushButton);


            this.#brushButton.addEventListener('click', () => {
                this.setBrush();
            });
        
        }

        this.dom.appendChild(toolsDiv);

        const modeDiv = document.createElement('div');
        modeDiv.className = 'draw-mode-setting';

        {
            this.#eraseButton = document.createElement('button');
            this.#eraseButton.className = 'btn btn-secondary active';
            this.#eraseButton.innerHTML = '<i class="bi bi-eraser"></i>';
            this.#eraseButton.title = 'Erase Selection';
            this.#eraseButton.setAttribute('data-bs-toggle', 'tooltip');

            modeDiv.appendChild(this.#eraseButton);

            this.#eraseButton.addEventListener('click', () => {
                this.setDrawMode();
            });
        }

        this.dom.appendChild(modeDiv);

        this.#brushSizeDiv = document.createElement('div');
        this.#brushSizeDiv.className = 'brush-size-range';
        this.#brushSizeDiv.hidden = true;
        {
            this.#brushSizeInput = new RangeInput('',{ min: 20, max: 100, step: 5, value: 20});
            this.#brushSizeInput.onchange = ((value) => {
                this.scene.brushSize = value;

            });
    
            this.#brushSizeDiv.appendChild(this.#brushSizeInput.dom);
        }

        this.dom.appendChild( this.#brushSizeDiv);

        this.render();
    }

    /**
     * Updates to selector state.
     * 
     * @returns {this}
     */
    setSelect() {
        if (this.#selectButton.disabled) return this;

        const scene = this.scene;
        scene.interactMode = 'select';
        scene.selectedToolType = 'selector';

        return this;
    }

    /**
     * Updates drawing with brush.
     * 
     * @returns {this}
     */
    setBrush() {
        if (this.#brushButton.disabled) return this;

        const scene = this.scene;
        scene.selectedToolType = 'brush';
        scene.interactMode = 'draw';
        scene.drawMode = 'add';

        return this;
    }

    /**
     * Updates drawing using with rectangle box.
     * 
     * @returns {this}
     */
    setBox() {
        if (this.#boxButton.disabled) return this;

        const scene = this.scene;
        scene.selectedToolType = 'box';
        scene.interactMode = 'draw';
        scene.drawMode = 'add';

        return this;
    }

    /**
     * Updates drawing using polygon.
     * 
     * @returns {this}
     */
    setPolygon() {
        if (this.#polygonButton.disabled) return this;

        const scene = this.scene;
        scene.selectedToolType = 'polygon';
        scene.interactMode = 'draw';
        scene.drawMode = 'add';

        return this;
    }

    /**
     * Updates drawing using curvature.
     * 
     * @returns {this}
     */
    setCurvature() {
        if (this.#curvatureButton.disabled) return this;

        const scene = this.scene;
        scene.selectedToolType = 'curvature';
        scene.interactMode = 'draw';
        scene.drawMode = 'add';

        return this;
    }

    /**
     * Updates draw mode.
     * 
     * @returns {this}
     */
    setDrawMode() {
        if (this.#eraseButton.hidden) return this;

        const scene = this.scene;
        if (scene.drawMode !== 'erase') {
            scene.drawMode = 'erase';
        } else {
            scene.drawMode = 'add';
        }

        return this;
    }

    /**
     * Updates the view of this object.
     */
    render = () => {
        const scene = this.scene; 

        this.#selectButton.disabled = false;
        // TODO change to scene.readOnly
        this.#boxButton.disabled = scene === null;
        this.#brushButton.disabled = scene === null;
        this.#curvatureButton.disabled = scene === null;
        this.#polygonButton.disabled = scene === null;

        const drawMode = scene.drawMode;
        const selectedTool = scene.selectedToolType;
        const interactMode = scene.interactMode;

        this.#brushSizeDiv.hidden = selectedTool !== 'brush';
        this.#brushSizeInput.value = scene.brushSize;

        this.#eraseButton.hidden = selectedTool === 'selector' || interactMode === 'navigate';

        this.#eraseButton.style.background = (drawMode === 'erase') ? 'cornflowerblue': '';
        this.#selectButton.style.background = (selectedTool === 'selector') ? 'cornflowerblue': '';
        this.#boxButton.style.background = (selectedTool === 'box') ? 'cornflowerblue': '';
        this.#brushButton.style.background = (selectedTool === 'brush') ? 'cornflowerblue': '';
        this.#polygonButton.style.background = (selectedTool === 'polygon') ? 'cornflowerblue': '';
        this.#curvatureButton.style.background = (selectedTool === 'curvature') ? 'cornflowerblue': '';
    };
}