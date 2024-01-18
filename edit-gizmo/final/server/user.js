import { serverEventNames } from "../common/server-event-names.js";
import { pushState, pushToAll } from "./websocket.js";

// Key is userId, value is user object
const _users = {};

// Key is userId, value is { position, timestamp }
const _userPositions = {};

export const updateUser = async (userId, userData) => {
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

export const updateUserPosition = (userId, positionData) => {
    let user = _users[userId]
    if (!user) {
        console.warn('user.updateUserPosition: user not found');
        return;
    }

    // Cache the user position
    _userPositions[userId] = positionData;
    
    pushState([{
        stateKey: 'userPositions',
        entityId: userId,
        data: positionData
    }]);
    pushToAll(serverEventNames.userPositionUpdated, { userId });
};

export const getUsers = () => {
    return _users;
};

export const removeUser = (userId) => {
    delete _users[userId];
    
    // Push a null user state to remove the user from the client
    pushState([{
        stateKey: 'users',
        entityId: userId,
        data: null
    }]);

    // Also remove the user position
    delete _userPositions[userId];

    // and push a null user position state to remove the user position from the client
    pushState([{
        stateKey: 'userPositions',
        entityId: userId,
        data: null
    }]);

};

export const getUserPositions = () => {
    return _userPositions;
}
