import { Vector3 } from "babylonjs";

import { createLocalAvatar, createRemoteAvatar, getRemoteUserAvatar, destroyAvatar, clearAvatars, getLocalUserAvatar } from "./avatar";
import { eventNames, subscribe } from "./events";
import { getState, getCurrentUserId } from "./state";
import { callOnRender, createScene } from "./scene";
import { createBackground } from "./background";
import { debugLog } from "../common/util";
import { send } from "./websocket";
import { clientMessageNames } from "../common/client-message-names";

let _currentRoomId = null;

const _localUserPositionUpdateHz = 10; // 4 times per second
const _localUserPositionUpdateInterval = 1000 / _localUserPositionUpdateHz; 
const _remoteUserPositionUpdateHz = 10; // 4 times per second
const _remoteUserPositionUpdateInterval = 1000 / _remoteUserPositionUpdateHz;

let _localUserPositionUpdateObserver;
let _remoteUserPositionUpdateObserver;

// Key is userId, value is { position, timestamp }
const _remoteUserPositions = new Map();

const _tmpPositionVector = new Vector3();

export const _init = () => {
    // Subscirbe to user joins and leaves room events
    subscribe(eventNames.userJoinedRoom, ({ userId, roomId }) => 
            onUserJoinedRoom(userId, roomId));
    subscribe(eventNames.userLeftRoom, ({ userId }) =>
            onUserLeftRoom(userId));

    // Subscribe to the remote user position update event
    subscribe(eventNames.userPositionUpdated, ({ userId }) => 
            onRemoteUserPositionUpdated(userId));
};

export const getCurrentRoomId = () => {
    return _currentRoomId;
};

const onUserJoinedRoom = (userId, roomId) => {
    debugLog('room', 'room-state.onUserJoinedRoom: userId, roomId = ', userId, roomId);
    if (userId === getCurrentUserId()) {
        // We joined the room
        _currentRoomId = roomId;
        onLocalUserJoinedRoom()
    } else if (roomId === _currentRoomId) {
        // Another user joined the room
        onRemoteUserJoinedRoom(userId);
    }
};

const onLocalUserJoinedRoom = () => {
    // Clear avatars from previous room
    clearAvatars(); 
    
    // Create a new scene
    createScene();

    // Create the background
    createBackground(_currentRoomId);

    // Create the local user avatar
    createLocalAvatar();

    // Create avatar for each remote user
    const room = getState('rooms', _currentRoomId);
    room.users.forEach((userId) => {
        if (userId !== getCurrentUserId()) {
            createRemoteAvatar(userId);
        }
    });

    if (_localUserPositionUpdateObserver) {
        //Remove the observer
    }

    if (_remoteUserPositionUpdateObserver) {
        // Remove the observer
    }

    // Start the update loop for the local user position
    _localUserPositionUpdateObserver = callOnRender(sendUserPositionUpdate, _localUserPositionUpdateInterval);

    // Start the update loop for the remote user positions
    _remoteUserPositionUpdateObserver = callOnRender(updateRemoteUserPositions, _remoteUserPositionUpdateInterval);
};

const onRemoteUserJoinedRoom = (userId) => {
    // Create an avatar for the remote user
    const avatar = createRemoteAvatar(userId);
};

const onUserLeftRoom = (userId) => {
    destroyAvatar(userId);
};

const onRemoteUserPositionUpdated = (userId) => {
    // Don't do anything if the current user's position was updated
    if (userId === getCurrentUserId) {
        return;
    }

    const avatar = getRemoteUserAvatar(userId);
    if (!avatar) {
        return;
    }

    const timestamp = Date.now();

    // Get the updated position for the user
    const positionUpdate = getState('userPositions', userId);
    if (!positionUpdate) {
        return;
    }

    const remoteTimestamp = positionUpdate.timestamp;
    
    //_remoteUserPositions.set(userId, positionUpdate);
    let remotePositionData = _remoteUserPositions.get(userId);
    if (!remotePositionData) {
        remotePositionData = {};
        _remoteUserPositions.set(userId, remotePositionData);
    }

    // Ignore any position updates that are older than the current position
    if (remoteTimestamp < remotePositionData.remoteTimestamp) {
        debugLog('room', 'room-state.onRemoteUserPositionUpdated: ignoring position update for user ', userId, ' because it is older than the current position');
        return;
    }

    const { x: remotePositionX, y: remotePositionY } = positionUpdate.position;
    

    const interpolationStartPosition = remotePositionData.interpolationStartPosition || new BABYLON.Vector3();
    interpolationStartPosition.copyFrom(avatar.position);

    const remotePosition = remotePositionData.position || new BABYLON.Vector3();
    remotePosition.set(remotePositionX, remotePositionY, avatar.position.z);

    remotePositionData.timestamp = timestamp;
    remotePositionData.remoteTimestamp = remoteTimestamp;
    remotePositionData.position = remotePosition;
    remotePositionData.interpolationStartPosition = interpolationStartPosition;
};

const sendUserPositionUpdate = () => {
    // Get the local user's avatar
    const avatar = getLocalUserAvatar();

    // If the avatar doesn't exist, bail
    if (!avatar) {
        return;
    }

    // If the avatar hasn't moved, bail
    if (!avatar.needsUpdate) {
        return;
    }

    // Get the timestamp
    const timestamp = Date.now();
    const { x, y } = avatar.position;
    send(clientMessageNames.updateUserPosition, { position: { x, y }, timestamp });
    avatar.needsUpdate = false;
};

const updateRemoteUserPositions = () => {
    // Iterate over each remote user position
    _remoteUserPositions.forEach((positionData, userId) => {
        // If there is a pending position update for the user, lerp the avatar position
        if (positionData.timestamp !== 0) {
            // Lerp the avatar position
            lerpRemoteAvatarPosition(userId);
        }
    });
}

const lerpRemoteAvatarPosition = (userId) => {
    // Get the avatar for the user
    const avatar = getRemoteUserAvatar(userId);

    // Bail if the avatar isn't valid
    if (!avatar) {
        return;
    }
    
    // Get the remote user position data
    const remoteUserPositionData = _remoteUserPositions.get(userId);
    if (!remoteUserPositionData) {
        return;
    }
    const { position: targetPosition, 
            interpolationStartPosition: interpolationStartPosition,
            timestamp: remotePositionTimestamp 
    } = remoteUserPositionData;

    const timestamp = Date.now();

    const remotePositionTimestampEnd = remotePositionTimestamp + _remoteUserPositionUpdateInterval;
    if (timestamp < remotePositionTimestampEnd) {
        const t = (timestamp - remotePositionTimestamp) / _remoteUserPositionUpdateInterval;
        BABYLON.Vector3.LerpToRef(interpolationStartPosition,targetPosition, t, avatar.position);
    } else if (remotePositionTimestamp !== 0) {
        avatar.position.copyFrom(targetPosition);
        // Reset timestamps to indicate the remote user position is no longer relevant
        // We don't delete the remoteUserPositionData becasue we want to reuse the vectors
        remoteUserPositionData.timestamp = 0;
        remoteUserPositionData.remoteTimestamp = 0;
    }
};
