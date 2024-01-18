import { CreatePlane } from "babylonjs";

import { send } from "./websocket";
import { subscribe, eventNames } from "./events";
import { clientMessageNames } from "../common/client-message-names";
import { getCurrentRoomId } from "./room-state";
import { pixelsPerBabylonUnit } from "../common/util";
import { getState, getCurrentUserId } from "./state";
import { getScene } from "./scene";
import { attachEditAction, init as initEdit, setEditEnabled } from "./embedded-image.edit";
import { getBackgroundDims } from "./background";

export const _init = () => {
    // Subscribe to the embedded image created event
    subscribe(eventNames.embeddedImageCreated, handleEmbeddedImageCreated);

    subscribe(eventNames.embeddedImageUpdated, handleEmbeddedImageUpdated);

    initEdit(handleMoveorResize, handleMoveorResize);
};

export const createEmbeddedImage = async (imageUrl) => {
    // Get current room
    const roomId = getCurrentRoomId();
    send(clientMessageNames.createEmbeddedImage, { roomId, imageUrl });
};

export const addAllEmbeddedImagesForRoom = (roomId) => {
    const embeddedImageStates = getState('embeddedImages');
    if (!embeddedImageStates) {
        // Likely just don't have any embedded images yet
        return;
    }

    const embeddedImages = Object.values(embeddedImageStates);

    embeddedImages.forEach((embeddedImage) => {
        if (embeddedImage.roomId === roomId) {
            addEmbeddedImageToRoom(embeddedImage.id, embeddedImage);
        }
    });
};

const handleMoveorResize = (embeddedImageMesh) => {
    const embeddedImage = getState("embeddedImages", embeddedImageMesh.embeddedImageId);
    if (!embeddedImage) {
        console.warn("In handleMoveorResize - embeddedImage is null");
        return;
    }

    // Send a socket message to the server to update the embedded image
    send(clientMessageNames.updateEmbeddedImage, {
        imageId: embeddedImage.id,
        positionX: embeddedImageMesh.position.x,
        positionY: embeddedImageMesh.position.y,
        width: embeddedImageMesh.scaling.x,
        height: embeddedImageMesh.scaling.y
    });
};


const handleEmbeddedImageCreated = (event) => {
    const { roomId, imageId } = event;

    // if the embedded image was not added to the current room, ignore it
    if (roomId !== getCurrentRoomId()) {
        return;
    }

    const embeddedImageMesh = addEmbeddedImageToRoom(imageId);

    // If the local user created the embedded image, select it
    if (event.userId === getCurrentUserId()) {
        setEditEnabled(embeddedImageMesh, true);
    }
};

const handleEmbeddedImageUpdated = (event) => {
    const { roomId, imageId } = event;

    // if the embedded image was not added to the current room, ignore it
    if (roomId !== getCurrentRoomId()) {
        return;
    }

    updateEmbeddedImageMesh(imageId);
};

const addEmbeddedImageToRoom = (imageId, embeddedImage) => {
    if (!embeddedImage) {
        // Get the embedded image from the state
        embeddedImage = getState("embeddedImages", imageId);
    }

    // Create the mesh for the embedded image
    const embeddedImageMesh = createEmbeddedImageMesh(embeddedImage);

    attachEditAction(embeddedImageMesh);

    return embeddedImageMesh;
};

const createEmbeddedImageMesh = (embeddedImage) => {
    const scene = getScene();
    if (!scene) {
        console.warn("In createEmbeddedImageMesh - scene not initialized");
        return;
    }

    // Create a plane mesh for the embedded image
    const id = `img-${embeddedImage.id}`;

    let width = embeddedImage.width || embeddedImage.widthPx / pixelsPerBabylonUnit;
    let height = embeddedImage.height || embeddedImage.heightPx / pixelsPerBabylonUnit;

    // Clamp Width and Height to be less than background image width and height
    const { bgWidth, bgHeight } = getBackgroundDims();
    if (width > bgWidth || height > bgHeight) {
        // Figure out which ratio is bigger, width or height
        const widthRatio = bgDims.width / width;
        const heightRatio = bgDims.height / height;
        if (widthRatio < heightRatio) {
            // width is the smaller ratio, so clamp width to background image width
            width = bgDims.width * 0.9;
            height = width * (embeddedImage.height / embeddedImage.width);
        } else {
            // height is the smaller ratio, so clamp height to background image height
            height = bgDims.height * 0.9;
            width = height * (embeddedImage.width / embeddedImage.height);
        }
    }

    const mesh = CreatePlane(id, { size: 1 }, scene);

    mesh.material = new BABYLON.StandardMaterial(`${id}-mat`, scene);
    mesh.material.diffuseTexture = new BABYLON.Texture(embeddedImage.url, scene);

    // Also set the embedded image id on the mesh so we can get the associated embedded image
    // from the mesh
    mesh.embeddedImageId = embeddedImage.id;

    // Set the position of the embedded image
    mesh.position.x = embeddedImage.positionX || 0;
    mesh.position.y = embeddedImage.positionY || 0;

    mesh.scaling.x = width;
    mesh.scaling.y = height;

    return mesh;
};

const updateEmbeddedImageMesh = (imageId) => {
    const embeddedImage = getState("embeddedImages", imageId);
    if (!embeddedImage) {
        console.warn("In updateEmbeddedImageMesh - embeddedImage is null");
        return;
    }

    const embeddedImageMesh = getScene().getMeshByID(`img-${imageId}`);
    if (!embeddedImageMesh) {
        console.warn("In updateEmbeddedImageMesh - embeddedImageMesh is null");
        return;
    }

    // Update the embedded image mesh
    embeddedImageMesh.position.x = embeddedImage.positionX;
    embeddedImageMesh.position.y = embeddedImage.positionY;
    embeddedImageMesh.scaling.x = embeddedImage.width;
    embeddedImageMesh.scaling.y = embeddedImage.height;
};



    

