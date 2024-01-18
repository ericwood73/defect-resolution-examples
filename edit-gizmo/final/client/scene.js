// Import the necessary BabylonJS modules
import * as BABYLON from 'babylonjs';
import { debugLog, isDebugEnabled } from '../common/util';
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
        fire(eventNames.sceneDestroyed, _scene);
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

    debugLog('scene', "In scene.createScene - scene = ", _scene);
};

export const callOnRender = (callback, interval = null) => {
    // Create an observer that will call the given callback no 
    // more than once per interval
    const observer = _scene.onBeforeRenderObservable.add(() => {
        if (!interval) {
            callback();
            return;
        }

        const currentTime = performance.now();
        if (!observer._lastCallTime ||
            currentTime - observer._lastCallTime >= interval) {
            observer._lastCallTime = currentTime;
            callback();
        }
    });
    return observer;
};




