import { serverEventNames } from "../common/server-event-names.js";

let connections = {};

export const registerUser = (connection, req) => {
    connections[connection.userId] = connection;
};

export const unregisterUser = (connection, req) => {
    delete connections[connection.userId];
};

export const pushToAll = (eventName, data) => {
    for(const userId in connections) {
        pushToUser(eventName, data, userId);
    }
};

export const pushToUser = (eventName, data, userId) => {
    const connection = connections[userId];
    if(connection) {
        connection.socket.send(JSON.stringify({
            eventName,
            data,
        }));
    }
};

export const pushState = (entitiesToPush) => {
    pushToAll(serverEventNames.stateUpdated, entitiesToPush);
};