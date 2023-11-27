// Import the necessary BabylonJS modules
import * as BABYLON from 'babylonjs';
import { isDebugEnabled } from '../common/util';
import { createCamera } from './camera';
import { eventNames, fire } from './events';

let _scene;
let _canvas;
let _engine;

export const _init = (canvas) => {
    // Create a new BabylonJS scene
    _engine = new BABYLON.Engine(canvas, true);
    _canvas = canvas;
};

export const getScene = () => {
    return _scene;
};

export const getCanvas = () => {
    return _canvas;
};

export const createScene = (canvas) => {
    // Dispose of existing scene
    if (_scene) {
        _scene.dispose();
    }

    _scene = new BABYLON.Scene(_engine);

    createCamera(_scene);    

    // Run the scene
    _engine.runRenderLoop(() => {
        _scene.render();
    });

    // Call engine.resize() when the window is resized
    window.addEventListener('resize', () => {
        _engine.resize();
        fire(eventNames.canvasResized);
    });

    // Notify subscribers that the scene has been created
    fire(eventNames.sceneCreated, _scene);
};



