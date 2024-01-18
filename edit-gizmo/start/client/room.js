import { fire, subscribe, eventNames } from './events.js';
import { getState, getCurrentUserId } from './state.js';
import { debugLog } from '../common/util.js';
import { send } from './websocket.js';
import { clientMessageNames } from '../common/client-message-names.js';

let roomSelectElement = null;
let roomCreateModal = null;

export const _init = () => {
    console.log('Initializing room');
    // get a reference to the room selection element
    roomSelectElement = document.getElementById('room-select');
    roomSelectElement.addEventListener('change', onRoomSelect);

    // get a reference to the room create modal
    roomCreateModal = document.getElementById('create-room-modal');

    // Get a reference to the room create form
    const roomCreateForm = document.getElementById('create-room-form');
    roomCreateForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const roomName = document.getElementById('create-room-name').value;
        const roomBackground = document.getElementById('create-room-background-url').value;
        createRoom(roomName, roomBackground);
    });

    // Get a reference to the room create cancel button
    const roomCreateCancel = document.getElementById('create-room-cancel');
    roomCreateCancel.addEventListener('click', () => {
        roomCreateModal.classList.add('hidden');
    });

    // Subscribe to the initial state event
    subscribe(eventNames.initialState, onInitialState);
};

export const joinRoom = async (roomId = undefined) => {
    send(clientMessageNames.joinRoom, { roomId });
};

const createRoom = async (roomName, roomBackground) => {
    // Hide the room create modal
    roomCreateModal.classList.add('hidden');

    // Send a socket message to the server to create a room
};

const onRoomSelect = async (event) => {
    console.log('room.onRoomSelect: selected room ', event.target.value);
    const roomId = event.target.value;
    if (roomId === 'new-room') {
        showRoomCreateModal();
    } else {
        await joinRoom(roomId);
    } 
};

const showRoomCreateModal = () => {
    roomCreateModal.classList.remove('hidden');
};

const onInitialState = () => {
    updateRooms();
};

const updateRooms = () => {
    const rooms = getState('rooms');
    const roomIds = Object.keys(rooms);

    // Clear room list
    roomSelectElement.innerHTML = '';

    // Make sure first option is always Create New Room
    const option = document.createElement('option');
    option.value = 'new-room';
    option.text = 'Create New Room';
    roomSelectElement.appendChild(option);

    // Populate the room select element
    roomIds.forEach((roomId, index) => {
        const option = document.createElement('option');
        option.value = roomId;
        option.text = rooms[roomId].name;
        if (index === 0) {
            option.selected = true;
        }
        roomSelectElement.appendChild(option);
    });
}
