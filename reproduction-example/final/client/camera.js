import { Vector2 } from "babylonjs";
import { Camera as BabylonCamera } from "babylonjs";

import { subscribe } from "./events";
import { getBackgroundDims } from "./background";
import { getCanvas } from "./scene";

const _lowerRadiusLimit = 29;
const _upperRadiusLimit = 62;

let _horizontalFOV = 0.48;
let _verticalFOV = 0.28;

let _camera;

let _targetBounds = {
    max: new Vector2(),
    min: new Vector2(),
};

export const createCamera = (scene) => {
    // Create an ArcRotateCamera and attach it to the scene
    scene.createDefaultCameraOrLight(true, true, true);
    _camera = scene.activeCamera;
    _camera.lowerRadiusLimit = _lowerRadiusLimit;
    _camera.upperRadiusLimit = _upperRadiusLimit;
    _camera.minZ = _lowerRadiusLimit - 1;
    _camera.maxZ = _upperRadiusLimit + 1;
    _camera.radius = (_upperRadiusLimit + _lowerRadiusLimit) / 2;

    _camera.attachControl(
		null, // ignored
		false, // prevent default
		false, // do not use ctrl key for panning
		0 // use left mouse button for panning
	); 

    _camera.speed = 1;
	_camera.inertia = 0;
    _camera.wheelPrecision = 1; // zoom speed

    // Only allow left mouse button to control camera.  Disable right,
	// which would be used for rotation since we specific left is for panning
	_camera.inputs.attached.pointers.buttons = [0];

	_camera.panningDistanceLimit = 0;

    _camera.onViewMatrixChangedObservable.add(handleViewMatrixUpdate);

    subscribe('backgroundSizeUpdated', handleBackgroundSizeUpdated);
    subscribe('canvasResized', handleCanvasResized);
};

// Keep the camera in bounds, adjusting target to keep the 
// entire FOV in the bounds of the background
export const ensureCameraInBounds = () => {
	ensureTargetPositionInBounds(_camera.target);
};

const getScreenRatio = () => {
    const canvas = getCanvas();
	let screenRatio = canvas.width / canvas.height;
    return screenRatio;
};

const handleCanvasResized = () => {
    if (!_camera) {
		return;
	}
    
    const screenRatio = getScreenRatio();

	const currentCameraFovMode = _camera.fovMode;
    const { width: backgroundWidth, height: backgroudHeight } = getBackgroundDims();
    const backgroudAspectRatio = backgroundWidth / backgroudHeight;
	let updatedCameraFovMode = screenRatio < backgroudAspectRatio ? 
	        BabylonCamera.FOVMODE_VERTICAL_FIXED : BabylonCamera.FOVMODE_HORIZONTAL_FIXED;

	if (updatedCameraFovMode != currentCameraFovMode) {
		_camera.fovMode = updatedCameraFovMode;
		_camera.fov = updatedCameraFovMode === BabylonCamera.FOVMODE_VERTICAL_FIXED ?
				    _verticalFOV : _horizontalFOV;
	}

	updateCameraTargetBounds();
};


const handleBackgroundSizeUpdated = (backgroundWidth, backgroudHeight) => {
	const screenRatio = getScreenRatio();
	let horizontalSize = backgroundWidth;
	let vertSize = backgroudHeight;
	
	if (!_camera.upperRadiusLimit) {
		return;
	}

	let halfAngleH = Math.atan((horizontalSize / 2) / _camera.upperRadiusLimit);
	let halfAngleV = Math.atan((vertSize / 2) / _camera.upperRadiusLimit);

	// Double half angles with a little margin to make sure that we don't see the edge
	_horizontalFOV = halfAngleH * 1.999;
	_verticalFOV = halfAngleV * 1.999;

	if (screenRatio < backgroundWidth / backgroudHeight) {
		_camera.fovMode = BabylonCamera.FOVMODE_VERTICAL_FIXED;
		_camera.fov = _verticalFOV;
	} else {
		_camera.fovMode = BabylonCamera.FOVMODE_HORIZONTAL_FIXED;
		_camera.fov = _horizontalFOV;
	}
};

 const handleViewMatrixUpdate = () => {
	updateCameraTargetBounds();
	ensureCameraInBounds();
};

// Update the camera target min and max y based on current zoom
const updateCameraTargetBounds = () => {
	// Screen aspect ratio
	const screenRatio = getScreenRatio();

	// Get the half width and height of the camera frustum at the BG
	// it is going to be the current camera radius times the tangent
	// of half the fov
	let halfWidth, halfHeight;
	if (_camera.fovMode === BabylonCamera.FOVMODE_HORIZONTAL_FIXED) {
        halfWidth = _camera.radius * Math.tan(_camera.fov/2);
		halfHeight = halfWidth / screenRatio;
	} else {
        halfHeight = _camera.radius * Math.tan(_camera.fov/2);
		halfWidth = halfHeight * screenRatio;
	}

	const { width: backgroundWidth, height: backgroudHeight } = getBackgroundDims();

    // Update camera target bounds
	_targetBounds.max.x = backgroundWidth/2 - halfWidth;
	_targetBounds.max.y = backgroudHeight/2 - halfHeight;
	// Min is just negation of max
	_targetBounds.max.negateToRef(_targetBounds.min);

	ensureCameraInBounds();
};

const ensureTargetPositionInBounds = (targetPosition) => {
    const targetBounds = _targetBounds;
	if (targetPosition.x < targetBounds.min.x || targetPosition.x > targetBounds.max.x ||
		targetPosition.y < targetBounds.min.y || targetPosition.y > targetBounds.max.y) {
		targetPosition.copyFromFloats(
			    Math.min(targetBounds.max.x, Math.max(targetPosition.x, targetBounds.min.x)),
				Math.min(targetBounds.max.y, Math.max(targetPosition.y, targetBounds.min.y)),
				targetPosition.z
		);
	}
};

