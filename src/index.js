import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.css';
import './style.css';

import { WEBGL } from 'three/examples/jsm/WebGL';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { CoordinateFormat } from './config'
import { PointBuffer, PointCloud } from './pcd'
import { Scene } from './Scene.js';
import { Toolbar } from './scene';
import { Hint } from './scene/Hint';

const format = CoordinateFormat.ZXY;

/**
 * Loads point cloud data.
 * 
 * @returns {Promise<?PointCloud>}
 */
const getPcd = (async () => {
    const pcdLoader = new PCDLoader()
    let pointCloud = null;
    return new Promise((resolve, reject) => {
        pcdLoader.load(
            'pcd/pointcloud_labeling.pcd',
            (points) => {
                const data = points.geometry.getAttribute('position').array;
                const buffer = new PointBuffer(data, format, 3);
                const pointCloud = new PointCloud(buffer, 2.5);
                resolve(pointCloud);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
                return pointCloud;
            },
            (error) => {
                console.log(error)
                return pointCloud;
            }
        )
    }) 

});

/**
 * 
 * @param {string} filePath
 * @returns {Promise<?THREE.Group>}
 */
function loadOBJFile(filePath) {
    // Create a new instance of the OBJLoader
    const loader = new OBJLoader();

    // Load the OBJ file
    return new Promise((resolve, reject) => {
        loader.load(
            filePath, // path to the OBJ file
            function (object) {
                // Add the loaded object to the scene
                return resolve(object);
            },
            function (xhr) {
                // Output the progress of the loading
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                return null;
            },
            function (error) {
                // Output any loading errors
                console.error('An error occurred while loading the OBJ file:', error);
                return null;
            }
        ) 
    });

}

if (!WEBGL.isWebGL2Available()) {
    document.body.appendChild(WEBGL.getWebGL2ErrorMessage());
}

/**
 * @type {?Scene}
 */
let scene = null;

/**
 * 
 * @returns {Promise<PointCloud>}
 */
const callLoader = (async() => {
    const obj = await getPcd();
    return obj;
});

/**
 * @type {?Toolbar}
 */
let toolbar = null;

const hint = new Hint();

callLoader().then((obj) => {
    console.log(obj);

    /**
     * @type {THREE.Group[]}
     */
    const objs = [];
    
    loadOBJFile('pcd/visual/Area_5_lobby_1_gt.obj').then((obj1) => {
        objs.push(obj1);
    });

    loadOBJFile('pcd/visual/Area_5_lobby_1_pred.obj').then((obj2) => {
        objs.push(obj2);
    });

    scene = new Scene(obj, objs);
    toolbar = new Toolbar(scene);

    hint.scene = scene;
    document.body.appendChild(hint.dom);

    document.body.appendChild(toolbar.dom);
    document.body.appendChild(scene.dom);

});

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'd':
            scene.interactMode = 'draw';
            scene.drawMode = 'add';
            break;
        case 'b':
            toolbar.setBrush();
            break;
        case 'e':
            toolbar.setDrawMode();
            break;
        case 'p':
            toolbar.setPolygon();
            break;
        case 'c':
            toolbar.setCurvature();
            break;
        case 'r':
            toolbar.setBox();
            break;
        case 's':
            scene.selectSelection(null);
            toolbar.setSelect();
            break;
        default:
            scene.deselectSelection();
            scene.interactMode = 'navigate';
            scene.selectedToolType = null;
    }
});

function animate() {
    requestAnimationFrame(animate);

    hint.render();

    scene?.render();

}

animate();
