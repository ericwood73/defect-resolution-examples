import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket';
import { uuidv4 } from '../common/util.js';
import { getRooms, joinRoom, leaveRoom } from './room.js';
import { registerUser, unregisterUser } from './websocket.js';
import { getUsers, updateUser, removeUser } from './user.js';
import { clientMessageNames } from '../common/client-message-names.js';

// Fastify Hot Reload Support
export default function (fastify, ops, next) {
    next()
};

let connections = {};

const fastify = Fastify({
  logger: true
});

fastify.register(fastifyWebsocket);

fastify.get('/hello', (request, reply) => {
    reply.send({
        message: 'Hello Fastify'
    });
});

fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection /* SocketStream */, req /* FastifyRequest */) => {
        // Create a unique id for the user
        connection.userId = uuidv4();
        pushInitialState(connection, req);
        registerUser(connection, req);
        //joinRoom(connection.userId); // join default room
        
        connection.socket.on('message', handleMessage.bind(null, connection, req));

        connection.socket.on('close', handleClose.bind(null, connection, req));
    })
});

fastify.listen({ port: 3000 }, (err, address) => {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at: ${address}`);
});

export const pushInitialState = (connection, req) => {
    connection.socket.send(JSON.stringify({
        eventName: 'initialState',
        data: {
            userId: connection.userId,
            rooms: getRooms(),
            users: getUsers(),
        }
    }));
};

const handleClose = (connection, req) => {
    const userId = connection.userId;
    console.log(`Client ${userId} disconnected`);
    unregisterUser(connection, req);
    // remove the user from the room
    leaveRoom(userId);
    removeUser(userId);
};

const handleMessage = (connection, req, messageData) => {
    // Read messge from the buffer
    messageData = JSON.parse(messageData);
    console.log("In handleMessage - messageData: ", messageData);
    const handler = messageHandlers[messageData.messageName];
    if(handler) {
        handler(connection.userId, messageData.data);
    }
};

const messageHandlers = {
    [clientMessageNames.joinRoom]: joinRoom,
    [clientMessageNames.updateUser]: updateUser
};