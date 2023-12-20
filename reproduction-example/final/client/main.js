import { createLocalAvatar } from './avatar';
import { connect, send } from './websocket';
import { subscribe, eventNames } from './events';
import { _init as initState } from './state';
import { _init as initRoom, joinRoom } from './room';
import { _init as initRoomState } from './room-state';
import { _init as initScene } from './scene';
import { _init as initBoost } from './boost';
import { clientMessageNames } from '../common/client-message-names';

document.addEventListener('DOMContentLoaded', () => {
    flow();
});

const initLocalUser = async () => {
    const initials = prompt('Please enter your initials');
    // Send an update to the server with the user initials and position
    send(clientMessageNames.updateUser, {
        initials
    });
};

const flow = async () => {
    // Preconnect initialization
    initState();
    initRoom();

    // Connect to the server
    await connectAndWaitForInitialState();
    initLocalUser();

    // Join the default room
    joinRoom();

    // Postconnect initialization
    const canvas = document.getElementById('canvas');
    initScene(canvas);
    initRoomState();
    initBoost();
};

const connectAndWaitForInitialState = async () => {
    // Connect to the server
    await connect();

    const initialStatePromise = new Promise((resolve, reject) => {
        // Subscribe to the initial state event
        subscribe(eventNames.initialState, (initialState) => {
            resolve(initialState);
        });
    });

    return initialStatePromise;
}   
