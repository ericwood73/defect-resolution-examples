import { debugLog, getImmutableSnapshot } from "../common/util";
import { eventNames, subscribe } from "./events";

let state = {};

export const _init = () => {
    // Subscribe to the initial state event
    subscribe(eventNames.initialState, onInitialState);
    
    // Subscribe to state updates
    subscribe(eventNames.stateUpdated, updateState);
};

export const getCurrentUserId = () => {
    return state.userId;
};

export const getState = (stateKey, entityId = null) => {
    if (!state[stateKey]) {
        console.warn('state.getState: invalid state key', stateKey);
        return null;
    }

    if (entityId) {
        return state[stateKey][entityId];
    }
    
    return state[stateKey];
};

const onInitialState = (initialState) => {
    debugLog('state', "state.OnInitialState: initial state = ", initialState);
    state = { ...initialState };
};

const updateState = (updatedEntities) => {
    updatedEntities.forEach((updatedEntity) => {
        const { stateKey, entityId, data } = updatedEntity;
        
        // Null data means the entity was removed
        if (!data) {
            delete state[stateKey][entityId];
            return;
        }

        // Create the state key if it doesn't exist
        if (!state[stateKey]) {
            state[stateKey] = {};
        }

        state[stateKey][entityId] = { ...data };
    });
    debugLog('state', "state.updateState: after update state = ", getImmutableSnapshot(state));
};