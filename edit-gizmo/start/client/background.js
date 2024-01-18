import { pixelsPerBabylonUnit, debugLog } from "../common/util";
import { eventNames } from "./events";
import { getScene } from "./scene";
import { getState } from "./state";
import { fire } from "./events";

const defaultBgImageWidth = 32;
const defaultBgImageHeight = 18;

let backgroundWidth, backgroudHeight;

let mesh = null;

export const getBackgroundDims = () => { 
    return { width: backgroundWidth, height: backgroudHeight };
};

export const createBackground = (roomId) => {
    debugLog('background', "background.createBackground: roomId = ", roomId);
	const room = getState('rooms', roomId);
	if (!room) {
		console.warn("background.createBackground: room not found");
		return;
	}

    const scene = getScene();

	mesh = BABYLON.MeshBuilder.CreatePlane('bg_mesh', {
		size: 1
	}, scene);

	mesh.material = new BABYLON.StandardMaterial("bg_material", scene);	
	mesh.position.z = 0.001;

	mesh.actionManager = new BABYLON.ActionManager(scene);
	mesh.actionManager.hoverCursor = "grab";
	const onClick = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, ()=>{
		//game.scene.handleClickOnRoom();
	});
	mesh.actionManager.registerAction(onClick);

	const onMouseDown = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, ()=>{
		//game.scene.handleMouseDownOnRoom();
	});
	mesh.actionManager.registerAction(onMouseDown);

	const onMouseUp = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, ()=>{
		//game.scene.handleMouseUpOnRoom();
	});
	mesh.actionManager.registerAction(onMouseUp);

	setBackgroundImage(room.backgroundImageUrl, scene);
    updateBackgroundSize(room);
    
    debugLog('background', "background.createBackground: mesh = ", mesh);
};

// Update the background image
const setBackgroundImage = (url, scene) => {
	// Dispose of the old texture
    mesh.material.diffuseTexture?.dispose();
    const newBackgroundTexture = new BABYLON.Texture(url, scene);
	mesh.material.diffuseTexture = newBackgroundTexture;
};

const updateBackgroundSize = (room) =>{
    let widthScale, heightScale;
    if (room.backgroundImageWidthPx && room.backgroundImageHeightPx) {
        widthScale = room.backgroundImageWidthPx/pixelsPerBabylonUnit;
		heightScale = room.backgroundImageHeightPx/pixelsPerBabylonUnit;
	} else {
		widthScale = defaultBgImageWidth;
		heightScale = defaultBgImageHeight;
	}

	mesh.scaling.x = widthScale;
	mesh.scaling.y = heightScale;

    backgroundWidth = widthScale;
    backgroudHeight = heightScale; 

    fire(eventNames.backgroundSizeUpdated, 
        widthScale,
        heightScale
    )
};
