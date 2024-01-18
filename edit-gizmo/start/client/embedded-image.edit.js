import { 
    ActionManager, 
    PointerDragBehavior, 
    ExecuteCodeAction, 
    Vector3, 
    Observable,
    PointerEventTypes,
} from "babylonjs";

import { getScene } from "./scene";
import { subscribe, eventNames } from "./events";
import { addOnResizeObserver, attachEditGizmo, detachEditGizmo } from "./edit-gizmo";
import { debugLog } from "../common/util";

const _editModeCursor = "url('/assets/edit-mode-enabled-cursor.svg') 0 27, auto";
let _currentEditImageMesh;
let _scenePointerObserver;
let _editModeEnabled = false;

let _positionChangedCallback;
let _sizeChangedCallback;

let _resizeObserver;

export const init = (positionChangedCallback, sizeChangedCallback) => {
    // Subscribe to changes in edit mode
    subscribe(eventNames.editModeChanged, handleEditModeChanged);

    _positionChangedCallback = positionChangedCallback;
    _sizeChangedCallback = sizeChangedCallback;
};

export const attachEditAction = (mesh) => {
    mesh.actionManager = new ActionManager(getScene());
    mesh.actionManager.registerAction(editAction);

    if (!_resizeObserver) {
        _resizeObserver = addOnResizeObserver(imageResized);
    };

    initEmbeddedImageDragBehavior(mesh);
};

export const setEditEnabled = (embeddedImageMesh, editEnabled) => {
    if (!embeddedImageMesh) {
        console.warn("In setEditEnabled - embeddedImageMesh is null");
        return;
    }

    if (!_scenePointerObserver) {
        // Subscribe to pointer down events on the scene
        _scenePointerObserver = getScene().onPointerObservable.add(
            handleScenePointerAction
        );
    }

    // Set the current edit image
    _currentEditImageMesh = editEnabled ? embeddedImageMesh : null;

    // Attach the resize gizmo to the embedded image mesh
    if (editEnabled) {
        attachEditGizmo(embeddedImageMesh);
    } else {
        detachEditGizmo();
    }

    embeddedImageMesh.isPickable = editEnabled;
    embeddedImageMesh.getBehaviorByName("PointerDrag").enabled = editEnabled;
    embeddedImageMesh.actionManager.cursor = editEnabled ? _editModeCursor : null;
}

const editAction = new ExecuteCodeAction(
	BABYLON.ActionManager.OnPickTrigger,
	(e) => {
		if (e.meshUnderPointer && _editModeEnabled) {
			setEditEnabled(e.meshUnderPointer, true);
		}
	}
);

const handleEditModeChanged = ( editModeEnabled ) => {
    _editModeEnabled = editModeEnabled;

    // loop over all embedded images and set them all to be pickable
    const embeddedImages = getScene().meshes
            .filter((m) => typeof m.embeddedImageId !== "undefined");
    debugLog('embedded-image.edit', "handleEditModeChanged: embeddedImages = ", embeddedImages);
    embeddedImages.forEach((mesh) => setEditEnabled(mesh, editModeEnabled));
};

const handleScenePointerAction = (e) => {
    if (e.type === PointerEventTypes.POINTERTAP && 
        (!e.pickInfo.pickedMesh ||
        (e.pickInfo.pickedMesh !== _currentEditImageMesh &&
        !e.pickInfo.pickedMesh.isDescendantOf(_currentEditImageMesh)))) {
            // if the user clicked on the scene, deselect the embedded image
            disableEdit();
    }
}

const initEmbeddedImageDragBehavior = (embeddedImageMesh) => {
    // Attach the drag behavior to the mesh
    const dragBehavior = new PositionTrackingPointerDragBehavior({
        dragPlaneNormal: new Vector3(0, 0, 1),
    });
    embeddedImageMesh.addBehavior(dragBehavior);

    dragBehavior.onPositionUpdatedObservable.add((embeddedImageMesh) => {
        imageMoved(embeddedImageMesh);
    });
    
    // Disable the drag behavior initially (until the user enters edit mode)
    dragBehavior.enabled = false;
};

const imageResized = (embeddedImageMesh) => {
    _sizeChangedCallback(embeddedImageMesh);    
};

const imageMoved = (embeddedImageMesh) => {
    _positionChangedCallback(embeddedImageMesh);
};

// Listens for drag events on the specified drag behavior and only notifies observers if
// the position actually changed.  This is needed because OnDragEnd will fire when the pointer up
// happens over the mesh, regardless of whether the mesh was moved.
// Also optionally contrains the drag to positions that are within the specified background mesh.
// Note this class currently only works with the drag plane normal option
class PositionTrackingPointerDragBehavior extends PointerDragBehavior {
	constructor(options) {
        super(options);
		this.clampToBackground = options.clampToBackgroundMesh;
		this._positionAtDragStart = Vector3.Zero();
		this._onPositionUpdatedObservable = new Observable();
		this._registerObservers();
	}

    get onPositionUpdatedObservable() {
		return this._onPositionUpdatedObservable;
	}

	_registerObservers() {
		this.onDragStartObservable.add((event)=> {
			this._positionAtDragStart.copyFrom(this.attachedNode.position);
		});
		this.onDragEndObservable.add((event)=> {
			if (this.clampToBackground) {
				this._clampToBackground();
			}
			const positionDelta = this.attachedNode.position.subtract(this._positionAtDragStart);
			const positionDeltaInPlane = this._positionDeltaInPlane(positionDelta);
			if (positionDeltaInPlane.length() !== 0) {
				this._onPositionUpdatedObservable.notifyObservers(this.attachedNode);
			}
		});
	}
	
	_clampToBackground() {
		const background = this.clampToBackgroundMesh;
		if (background) {
			const backgroundScale = background.scaling;
			const minX = -backgroundScale.x / 2, maxX = backgroundScale.x / 2;
			const minY = -backgroundScale.y / 2, maxY = backgroundScale.y / 2;

			const position = this.attachedNode.position;

			if (position.x < minX) {
				position.x = minX;
			} else if (position.x > maxX) {
				position.x = maxX;
			}

			if (position.y < minY) {
				position.y = minY;
			} else if (position.y > maxY) {
				position.y = maxY;
			}
		}
	}

	_positionDeltaInPlane(positionDelta) {
        if (this._options.dragPlaneNormal) {
            const positionDeltaParallelToNormalMagnitude = BABYLON.Vector3.Dot(positionDelta,this._options.dragPlaneNormal);
		    return positionDelta.subtract(this._options.dragPlaneNormal.scale(positionDeltaParallelToNormalMagnitude));
		}
		else {
			console.warn("Can currently compute the delta in plane when the drag plane normal is specified.");
		}
	}
}

