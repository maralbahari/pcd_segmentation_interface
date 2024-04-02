
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ThreeUtils, Helper } from './utils';
import { PointCloud } from './pcd';
import { Brush, RectangleBox, Polygon, Curvature, DrawingTool } from './selectionTools';
import { EditSelection, LabelSelection, LabelClassSelector, SelectionInspector, LabelClass } from './selection';
import { Picker } from './picker';

/**
 * @typedef {import('./selectionTools/Brush').Circle} Circle
 */

/**
 * @typedef {'navigate' | 'draw' | 'select'} InteractMode
 */

/**
 * @typedef {'add' | 'erase'} DrawMode
 */

/**
 * @typedef {'brush' | 'polygon' | 'box' | 'curvature' | 'selector'} ToolTypes
 */

/**
 * Represents an event dispatched by {@link Scene}:
 * - `type`: The type (i.e., name) of the event.
 * 
 * @typedef {{
 *     type:
 *         'interactMode-changed' | 'selectedTool-changed' |
 *          'drawMode-changed' | 'hasSelectedSelection-changed'|
 *          'brushSize-changed'
 * }} SceneEvent
 */

export class Scene extends THREE.EventDispatcher{
    /**
     * The DOM of this object.
     * 
     * @readonly
     * @type {HTMLDivElement}
     */
    dom;

    /**
     * Contains all `three.js` objects in the scene.
     * 
     * @readonly
     * @type {THREE.Scene}
     */
    #scene = new THREE.Scene();

    /**
     * Visualizes the distance from the origin.
     * 
     * @readonly
     * @type {THREE.Object3D}
     */
    #gridHelper = new THREE.PolarGridHelper(250, 1, 5, 128);

    /**
     * A crosshair shown when the camera is being manipulated.
     * 
     * @type {HTMLLabelElement}
     */
    #crosshair;

    /**
     * Observes the DOM of this object for resize events.
     * 
     * @type {ResizeObserver}
     */
    #observer;

    /**
     * The renderer of this scene.
     * 
     * @type {THREE.WebGLRenderer}
     */
    #renderer;

    /**
     * The camera inside this scene.
     * 
     * @type {THREE.PerspectiveCamera}
     */
    #camera;

    /**
     * The controls used to move the camera.
     * 
     * @type {OrbitControls}
     */
    #controls;

    /**
     * The html selector of label class options.
     * 
     * @type {LabelClassSelector}
     */
    #labelClassSelector;

    /**
     * The html selector of label selection options.
     * 
     * @type {SelectionInspector}
     */
    #selectionInspector;

    /**
     * @type {Array<LabelSelection>}
     */
    #labelSelections = [];

    /**
     * List of label selections in the scene.
     * 
     * @type {Array<LabelSelection>}
     */
    get labelSelections() { return this.#labelSelections; }

    #updateCursor() {    
        switch (this.selectedToolType) {
            case 'brush':
                this.dom.style.cursor = 'none';
                this.selectedTool = this.#brush;
                this.#brush.mode = this.interactMode;
                break;
            case 'box':
                this.dom.style.cursor = 'cell';
                this.selectedTool = this.#box;
                this.#box.mode = this.interactMode;
                break;
            case 'polygon':
                this.dom.style.cursor = 'crosshair';
                this.selectedTool = this.#polygon;
                this.#polygon.mode = this.interactMode;
                break;
            case 'curvature':
                this.dom.style.cursor = 'crosshair';
                this.selectedTool = this.#curvature;
                this.#curvature.mode = this.interactMode;
                break;
            default:
                this.selectedTool = null;
                this.dom.style.cursor = 'default';
                this.canvasDeck.hidden = true;
        }

        return this;
    }

    #updateEnabled = () => {
        const { interactMode, selectedToolType, selectedSelection } = this;

        this.#controls.enabled = interactMode !== 'draw';
        this.#controls.enableRotate = interactMode === 'navigate' || interactMode === 'select';

        this.#brush.enabled = selectedToolType === 'brush';
        this.#box.enabled = selectedToolType === 'box';
        this.#polygon.enabled = selectedToolType === 'polygon';
        this.#curvature.enabled = selectedToolType === 'curvature';

        this.#selectionPicker.hoverEnabled =  interactMode === 'select';
        
        this.#selectionPicker.selectEnabled = interactMode === 'select';

        if (interactMode === 'draw') {
            console.log('pcd display');
            console.log(this.pointCloud.bufferNDC.length);
            console.log(this.pointCloud.buffer.getCoords().length);
            console.log('pcd settings');
            console.log(this.filteredPcd?.buffer.getCoords().length);
            console.log(this.filteredPcd?.bufferNDC.length);
            if (this.filteredPcd != null) {
                this.filteredPcd.bufferNDC = ThreeUtils.worldCoordsToNDC(this.filteredPcd.buffer.getCoords(), this.#camera);
            }
            if (selectedSelection != null) {
                selectedSelection.pointsNDC = ThreeUtils.worldCoordsToNDC(selectedSelection.points, this.#camera);
            }
        }
    };


    /**
     * @type {InteractMode} 
     */
    #interactMode = 'navigate';

    /**
     * The mode of user interaction with the scene.
     * 
     * @type {InteractMode}
     */
    get interactMode() { return this.#interactMode; }

    set interactMode(value) {
        if (this.interactMode !== value) {
            this.#interactMode = value;

            this.#updateCursor().#updateEnabled();
            this.dispatchEvent({ type: 'interactMode-changed' });
        }
    }

    /**
     * @type {DrawMode}
     */
    #drawMode = 'add';

    /**
     * The mode of drawing an object in the scene.
     * 
     * @type {DrawMode}
     */
    get drawMode() { return this.#drawMode; }

    set drawMode(value) {
        if (this.drawMode !== value) {
            this.#drawMode = value;

            this.#updateCursor().#updateEnabled();
            this.dispatchEvent({ type: 'drawMode-changed' });
        }
    }

    /**
    * @type {ToolTypes}
    */
    #selectedToolType;

    /**
     * The type of object to draw in the scene.
     * 
     * @type {ToolTypes}
     */
    get selectedToolType() { return this.#selectedToolType; }

    set selectedToolType(value) {
        if (this.selectedToolType !== value) {
            this.#selectedToolType = value;

            this.#updateCursor().#updateEnabled();            
            this.dispatchEvent({ type: 'selectedTool-changed' });
        }
    }

    /**
     * @type {boolean}
     */
    get hasSelectedTool () { return this.selectedTool != null; }

    /** 
     * @type {?DrawingTool}
     */
    #selectedTool;

    /**
     * The selected drawing tool in the scene.
     * 
     * @type {?DrawingTool}
     */
    get selectedTool() { return this.#selectedTool; }

    set selectedTool(value) {
        if (this.selectedTool !== value) {
            this.#selectedTool = value;

            this.#updateCursor().#updateEnabled();

            if (value != null) {
                value.addEventListener('begin-draw', async(e) => {
                    const drawnObject = e.drawnObject;
                    if (drawnObject != null) {
                        await this.#editSelection(drawnObject);
                    }
                });

                value.addEventListener('end-draw', async (e) => {
                    const drawnObject = e.drawnObject;
                    if (drawnObject != null) {
                        await this.#editSelection(drawnObject);
                    }
                });
            }
        }
    }

    /**
     * Whether the drawing tool is active.
     * 
     * @type {boolean}
     */
    get isDrawing() { return this.selectedTool !== null && this.selectedTool.isDrawing; }

    /**
     * The editor of to create/modify label selection in the scene.
     * 
     * @type {EditSelection}
     */
    #editor;

    /**
     * The brush drawing tool.
     * 
     * @type {Brush}
     */
    #brush;

    /**
     * @type {number}
     */
    #brushSize;

    /**
     * The size of brush diameter.
     * 
     * @type {number}
     */
    get brushSize() { return this.#brushSize};

    set brushSize(value) {
        if (this.brushSize !== value) {
            this.#brushSize = value;
            this.#brush.diameter = value;

            this.dispatchEvent({ type: 'brushSize-changed'});
        }
    }

    /**
     * Rectangle box drawing tool. 
     * 
     * @type {RectangleBox}
     */
    #box;

    /**
     * Polygon drawing tool.
     * 
     * @type {Polygon}
     */
    #polygon;

    /**
     * Curvature drawing tool.
     * 
     * @type {Curvature}
     */
    #curvature;

    /**
     * The class of labelled object that is selected.
     * 
     * @type {?LabelClass}
     */
    get selectedLabelClass() { return this.#labelClassSelector.selectedClass; }

    /**
     * Whether a label class is selected.
     * 
     * @type {boolean}
     */
    get hasSelectedLabelClass() { return this.selectedLabelClass != null; }

    /**
     * Helper to select/deselect a label selection in the scene.
     * 
     * @readonly
     * @type {Picker<LabelSelection>}
     */
    #selectionPicker;

    /**
     * Whether a label selection is being hovered over.
     * 
     * @type {boolean}
     */
    get isHoveringSelection() { return this.#selectionPicker.isHoveringObj; }

    /**
     * The label selection that is hovered over.
     * 
     * @type {?LabelSelection}
     */
    get hoveredSelection() { return this.#selectionPicker.hoveredObj; }

    /**
     * Whether a label selection is selected.
     * 
     * @type {boolean}
     */
    get hasSelectedSelection() { return this.#selectionPicker.hasSelectedObj; }

    /**
     * The selected label selection in the scene.
     * 
     * @type {?LabelSelection}
     */
    get selectedSelection() { return this.#selectionPicker.selectedObj; }

    /**
     * Creates a new label selection or modifies the selected label selection in the scene.
     * 
     * @param {Array<THREE.Vector2> | Circle} drawnObject 
     */
    #editSelection = async (drawnObject) => {
        const { filteredPcd, selectedLabelClass, selectedSelection, drawMode } = this;
        if (filteredPcd == null) return;

        if (selectedSelection != null) {
            await this.#editor.modifySelection(drawnObject, filteredPcd, selectedSelection, drawMode);
        } else {
            if (selectedLabelClass != null) {
                await this.#editor.createSelection(drawnObject, selectedLabelClass, filteredPcd);
            }
        }
    };

    /**
     * Selects a selection in the scene.
     * 
     * @param {LabelSelection} selection
     * @returns {this} This object.
     */
    selectSelection(selection) {
        this.#selectionPicker.selectedObj = selection;

        return this;
    }

    /**
     * Deselects the selected selection, if any.
     * 
     * @returns {this} This object.
     */
    deselectSelection() {
        this.#selectionPicker.selectedObj = null;

        return this;
    }

    /**
     * Deletes the selected selection.
     * 
     * @param {LabelSelection} selection 
     */
    deleteSelection(selection) {

    }

    /**
     * @type {?Array<THREE.Group>}
     */
    obj = null;

    /** 
     * @type {PointCloud}
     */
    #pointCloud;

    /**
     * The active point cloud in the scene.
     * 
     * @type {PointCloud}
     */
    get pointCloud() { return this.#pointCloud; }

    /**
     * @type {?PointCloud}
     */
    #filteredPcd;

    /**
     * Filtered point cloud based on labeled selections in the scene.
     * 
     * @type {?PointCloud}
     */
    get filteredPcd() { return this.#filteredPcd; }

    /**
     * @param {PointCloud} pointCloud
     * @param {?Array<THREE.Group>} obj
     */
    constructor(pointCloud, obj) {
        super();

        this.#pointCloud = pointCloud;
        this.#filteredPcd = this.pointCloud.clone();

        this.dom = document.createElement('div');
        this.dom.className = 'scene';
        
        this.obj = obj;
        const { width, height } = document.body.getBoundingClientRect();

        this.#crosshair = document.createElement('label');
        this.#crosshair.style.position = 'absolute';
        this.#crosshair.style.top = '50%';
        this.#crosshair.style.left = '50%';
        this.#crosshair.style.transform = 'translate(-50%, -50%)';
        this.#crosshair.style.fontSize = '2em';
        this.#crosshair.style.color = 'yellow';
        this.#crosshair.hidden = true;
        this.#crosshair.textContent = '+';
        this.dom.appendChild(this.#crosshair);

        const canvas2d = document.createElement('canvas');
        canvas2d.id = 'canvas-two';
        canvas2d.hidden = true;
        canvas2d.width = width;
        canvas2d.height = height;
        canvas2d.addEventListener('contextmenu',(e) =>  e.preventDefault());
        this.dom.appendChild(canvas2d);

        const canvas3d = document.createElement('canvas');
        canvas3d.id = 'canvas-three';
        canvas3d.width = width;
        canvas3d.height = height;
        canvas3d.addEventListener('contextmenu',(e) =>  e.preventDefault());
        this.dom.appendChild(canvas3d);

        this.canvasDeck = document.createElement('canvas');
        this.canvasDeck.id = 'canvas-deck';
        this.canvasDeck.width = width;
        this.canvasDeck.height = height;
        this.canvasDeck.hidden = true;
        this.canvasDeck.addEventListener('contextmenu',(e) =>  e.preventDefault());
        this.dom.appendChild(this.canvasDeck);

        this.#renderer = new THREE.WebGLRenderer({ canvas: canvas3d, alpha: true });
        this.#renderer.setPixelRatio(window.devicePixelRatio);
        this.#renderer.autoClear = true;

        this.#camera = new THREE.PerspectiveCamera(
            30,
            width / height,
            ThreeUtils.EPSILON,
            1 / ThreeUtils.EPSILON,
        );
        this.#camera.position.set(0, 50, 0);
        this.#camera.lookAt(0, 0, 0);

        this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
        this.#controls.addEventListener('start', () => {
            // Update the target of the controls to be approximately the point at the
            // center of the screen without changing the orientation of the camera
            // const pointCloud = this.pointCloud;
            // if (pointCloud == null) return;

            // const raycaster = new THREE.Raycaster();
            // raycaster.setFromCamera({ x: 0, y: 0 }, this.#camera);

            // // Allow the raycaster to work at different zoom levels
            // for (const threshold of [0.025, 0.25, 2.5]) {
            //     ThreeUtils.setRaycasterPointsThreshold(raycaster, threshold);

            //     const intersects = pointCloud.raycast(raycaster);
            //     if (intersects.length > 0) {
            //         const distance = intersects[0].distance;

            //         const v = this.#controls.target.clone().sub(this.#camera.position).normalize();
            //         const newTarget = this.#camera.position.clone().add(v.multiplyScalar(distance));

            //         this.#controls.target.copy(newTarget);
            //         break;
            //     }
            // }

            this.#crosshair.hidden = false;
        });
        this.#controls.addEventListener('end', () => {
            this.#crosshair.hidden = true;
        });

        // TODO labelset I/O
        const labelClasses = Helper.datasetLabelClasses();
        this.#labelClassSelector = new LabelClassSelector(labelClasses);
        this.dom.appendChild(this.#labelClassSelector.panel.dom);

        this.#selectionInspector = new SelectionInspector(this.#labelSelections, labelClasses);
        this.dom.appendChild(this.#selectionInspector.panel.dom);

        this.#selectionInspector.addEventListener('selectedSelection-changed', (e) => {
            if (e instanceof LabelSelection) {
                this.selectSelection(e.selection);
            }
        });

        this.#selectionInspector.addEventListener('classify', (e) => {
            console.log('change');
            const labelSelection = e.selection; 
            const labelClass = e.labelClass;
            console.log(labelSelection);
            console.log(labelClass);

            // update labelset
            if (labelSelection instanceof LabelSelection) {
                this.#labelSelections
                    .forEach((selection, i) => {
                        if (selection.id === labelSelection.id) {
                            if (labelClass instanceof LabelClass) {
                                labelSelection.labelClass = labelClass;
                                this.#labelSelections[i] = labelSelection;
                            }
                        }
                    });
            }
        });
        
        const alignPanels = () => {
            this.#labelClassSelector.panel.alignTop().alignRight();
            this.#selectionInspector.panel.alignRight().alignCenterVertical();
        };

        this.#observer = new ResizeObserver(() => {
            const { width: newWidth, height: newHeight } = this.dom.getBoundingClientRect();

            this.#renderer.setSize(newWidth, newHeight);

            this.#camera.aspect = newWidth / newHeight;
            this.#camera.updateProjectionMatrix();

            canvas2d.height = newHeight;
            canvas2d.width = newWidth;

            alignPanels();
        });
        this.#observer.observe(this.dom);

        this.#brush = new Brush(this.dom);
        this.brushSize = this.#brush.diameter;
        this.dom.appendChild(this.#brush.cursor);

        this.#box = new RectangleBox(this.dom, canvas2d);

        this.#polygon = new Polygon(this.dom, canvas2d);

        this.#curvature = new Curvature(this.dom, canvas2d);

        this.#selectionPicker = new Picker(
            this.#camera, 
            this.#renderer.domElement,
            (obj, raycaster) => obj.raycast(raycaster),
        );

        ThreeUtils.setRaycasterPointsThreshold(this.#selectionPicker.raycaster, 0.25);
        
        this.#selectionPicker.objects = this.#labelSelections;

        this.#selectionPicker.addEventListener('selectin', async (e) => {
            const selectedSelection = e.object;
            if (selectedSelection == null) return;

            this.#selectionInspector.selectedSelection = selectedSelection;

            this.dispatchEvent({ type: 'hasSelectedSelection-changed' });
        });

        this.#selectionPicker.addEventListener('selectout', (e) => {
            this.#selectionInspector.selectedSelection = null;

            this.dispatchEvent({ type: 'hasSelectedSelection-changed' });
        });

        this.#editor = new EditSelection();
        this.#editor.addEventListener('selection-added', async(e) => {
            const {labelSelection, queriedPoints}  = e;
            if (queriedPoints === null || labelSelection === null) return;

            const {filteredPcd, drawMode} = this;
            // update labelset
            if (labelSelection instanceof LabelSelection) {
                this.#labelSelections.push(labelSelection);

                this.selectSelection(labelSelection);
            }

            if (filteredPcd != null) {
                this.#filteredPcd = ThreeUtils.filterPointCloud(filteredPcd, queriedPoints, drawMode);
            }

            this.#updateEnabled();
        });

        this.#editor.addEventListener('selection-changed', async(e) => {
            const {labelSelection, queriedPoints}  = e;
            if (queriedPoints === null || labelSelection === null) return;

            const {filteredPcd, drawMode} = this;
            // update labelset
            if (labelSelection instanceof LabelSelection) {
                this.#labelSelections
                    .forEach((selection, i) => {
                        if (selection.id === labelSelection.id) {
                            this.#labelSelections[i] = labelSelection;
                        }
                    });

                    if (filteredPcd != null) {
                        this.#filteredPcd = ThreeUtils.filterPointCloud(filteredPcd, queriedPoints, drawMode);
                    }           
            }

            this.#updateEnabled();
        });

        this.interactMode = 'navigate'; 
        this.#selectedTool = null;
        this.drawMode = 'add';
    }


    render() {
        const scene = this.#scene;
        scene.clear();

        scene.add(this.#gridHelper);

        const { pointCloud, labelSelections, obj } = this;

        if (pointCloud != null) {
            // scene.add(pointCloud.asObject3D());
        }

        if (obj != null) {
            obj.forEach((o, i) => {
                o.position.set(i*10, 0, 0);
                scene.add(o);

            });
        }

        for (const selection of labelSelections) {
            if (selection === this.selectedSelection) {
                selection.pointSize = pointCloud.pointSize;
                selection.setColor('yellow');
            } else if (selection === this.hoveredSelection) {
                selection.pointSize = pointCloud.pointSize + 1;
            } else {
                selection.pointSize = pointCloud.pointSize;
                selection.setColor(selection.labelClass?.color);
            }

            scene.add(selection?.asObject3D());
        }

        this.#renderer.render(scene, this.#camera);
    }
}