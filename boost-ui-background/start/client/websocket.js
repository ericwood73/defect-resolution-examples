import { debugLog } from '../common/util';
import { fire } from './events';

// get the host rom the borwser url without the port
const host = window.location.host.split(':')[0];
const serverUrl = `ws://${host}:3000/ws`;
let socket = null;

export const connect = async () => {
    const connectPromise = new Promise((resolve, reject) => {
        // Connect the websocket to the server
        socket = new WebSocket(serverUrl);
        socket.addEventListener('open', () => {
            console.log('Connected to server');
            resolve();
        });
    });

    return connectPromise.then(() => {
        // Route any messages to the event handler in events.js
        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            debugLog('websocket', 'Received message from server', message);
            fire(message.eventName, message.data);
        });
    });
}

export const send = (messageName, data) => {
    debugLog('websocket', 'Sending message to server', messageName, data);
    socket.send(JSON.stringify({
        messageName,
        data,
    }));
};