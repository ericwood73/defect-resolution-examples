import { createLocalAvatar, createRemoteAvatar, getAvatar, destroyAvatar, clearAvatars } from "./avatar";
import { eventNames, subscribe } from "./events";
import { getState, getCurrentUserId } from "./state";
import { createScene } from "./scene";
import { createBackground } from "./background";
import { debugLog } from "../common/util";

let _currentRoomId = null;

export const _init = () => {
    // Subscirbe to user joins and leaves room events
    subscribe(eventNames.userJoinedRoom, onUserJoinedRoom);
    subscribe(eventNames.userLeftRoom, onUserLeftRoom);

    // Subscribe to the remote user position update event
    subscribe(eventNames.userPositionUpdated, onUserPositionUpdated);
}

const onUserJoinedRoom = ({ userId, roomId }) => {
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
};

const onRemoteUserJoinedRoom = (userId) => {
    // Create an avatar for the remote user
    const avatar = createRemoteAvatar(userId);
};

const onUserLeftRoom = ({ userId, roomId }) => {
    destroyAvatar(userId);
};

const onUserPositionUpdated = ({ userId, position }) => {
    // Update the position of the avatar for the user
    const avatar = getAvatar(userId);
    avatar.position = position;
};
