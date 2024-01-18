import { GizmoManager } from "babylonjs";

import { getScene } from "./scene";
import { subscribeOnce, eventNames } from "./events";

let gizmoManager;

export const _init = () => {
    // Subscribe to scene ready for current room and any future rooms joined
    //subscribe(eventNames.sceneCreated, initializeForScene);
};

export const attachEditGizmo = (mesh) => {
    const gizmoManager = getGizmoManager();
    gizmoManager?.attachToMesh(mesh);
}

export const detachEditGizmo =  () => {
    // No need to init gizmoManager if it doesn't exist becasue we are detaching it
    if (gizmoManager) {
        gizmoManager.attachToMesh(null);
    }
}

/**
 * Register an observer to be called when the gizmo is used to resize a mesh
 * @param {*} resizeCallback a function that will be called when gizmo has
 *                           resized an attached mesh.
 * @returns an observer instance that can be used to removew the observer
 *          (by calling the remove() method on the observer)
 */
export const addOnResizeObserver = (resizeCallback) => {
    const gizmoManager = getGizmoManager();
    return gizmoManager.gizmos.boundingBoxGizmo
            .onScaleBoxDragEndObservable.add(() => {
                resizeCallback(gizmoManager.gizmos.boundingBoxGizmo.attachedMesh);
            });
};

const getGizmoManager = () => {
    if (!gizmoManager) {
        const scene = getScene();
        if (!scene) {
            console.warn("In getGizmoManager - scene is not ready yet");
            return;
        }
        initGizmoManager(scene);
    };

    return gizmoManager;
}

// const initializeForScene = (scene) => {
//     initGizmoManager(scene);
// }

const initGizmoManager = (scene) => {
    gizmoManager = new GizmoManager(scene);
    gizmoManager.boundingBoxGizmoEnabled = true;
    gizmoManager.positionGizmoEnabled = false;
    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.scaleGizmoEnabled = false;
    gizmoManager.gizmos.boundingBoxGizmo.includeChildPredicate = (mesh) => {
        return mesh.isEnabled();
    };

    gizmoManager.gizmos.boundingBoxGizmo.scaleBoxSize = 0.2;
    
    // By default, the gizmoManager bounding box will allow drag movement.  We want to use our own behavior that 
    // tracks position changes to avoid uncessessary position updates sent to server.
    gizmoManager.boundingBoxDragBehavior.disableMovement = true; 
    
    gizmoManager.gizmos.boundingBoxGizmo.scaleDragSpeed = 0.6; 
    
    // Disable attach on pointer
    gizmoManager.usePointerToAttachGizmos = false;

    // Disallow rotation about any axis
    gizmoManager.gizmos.boundingBoxGizmo.setEnabledRotationAxis("");
    
    // Enable scaling
    gizmoManager.gizmos.boundingBoxGizmo.setEnabledScaling(true);

    // turn off the z scale boxes and the boxes on the back side of the mesh
    const disableZScaleBoxes = true;
    const disableNonUniformScaleBoxes = false;

    // Get scale boxes ordered in increasing x, y , then z                         
    const scaleBoxes = gizmoManager.gizmos.boundingBoxGizmo.getScaleBoxes();
    scaleBoxes[1].setEnabled(!disableZScaleBoxes); // Back bottom left 
    scaleBoxes[2].setEnabled(!disableNonUniformScaleBoxes); // Left 
    scaleBoxes[4].setEnabled(!disableZScaleBoxes); // Back top left
    scaleBoxes[5].setEnabled(!disableNonUniformScaleBoxes); // Bottom
    scaleBoxes[6].setEnabled(!disableZScaleBoxes && !disableNonUniformScaleBoxes); // Front
    scaleBoxes[7].setEnabled(!disableZScaleBoxes && !disableNonUniformScaleBoxes); // Back
    scaleBoxes[8].setEnabled(!disableNonUniformScaleBoxes); // Top
    scaleBoxes[10].setEnabled(!disableZScaleBoxes); // Back bottom right
    scaleBoxes[11].setEnabled(!disableNonUniformScaleBoxes); // Right
    scaleBoxes[13].setEnabled(!disableZScaleBoxes); // Back top right
    
    // Disable initial selection
    gizmoManager.attachToMesh(null);

    //Subscribe to the scene destroyed event to clear the gizmoManager
    subscribeOnce(eventNames.sceneDestroyed, () => {
        if (gizmoManager) {
            gizmoManager.gizmos.boundingBoxGizmo.onScaleBoxDragEndObservable.clear();
            gizmoManager.dispose()
            gizmoManager = null;
        }
    });
}