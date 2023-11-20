import { serverEventNames } from "../common/server-event-names.js";
import { pushState, pushToAll } from "./websocket.js";

// Key is userId, value is user object
const _users = {};

export const updateUser = (userId, userData) => {
    let user = _users[userId]
    if (!user) {
        _users[userId] = { ...userData };
    }
    pushState([{
        stateKey: 'users',
        entityId: userId,
        data: userData
    }]);
    pushToAll(serverEventNames.userUpdated, { userId });
};

export const getUsers = () => {
    return _users;
};

export const removeUser = (userId) => {
    delete _users[userId];
    pushState([{
        stateKey: 'users',
        entityId: userId,
        data: null
    }]);
}