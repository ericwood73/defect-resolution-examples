import { serverEventNames } from '../common/server-event-names.js';
import { debugLog, uuidv4 } from '../common/util.js';

const _callbacksByEventName = {};		//key: event name, value: array of callback functions
const _callbackArgsByEventName = {}; //key: event name, value: array of args to be sent to the callback when the event is fired

export const eventNames = {
    ...serverEventNames,
    localUserJoinedRoom: 'localUserJoinedRoom',
	remoteUserJoinedRoom: 'remoteUserJoinedRoom',
	remoteAvatarCreated: 'remoteAvatarCreated',
	remoteUserPositionUpdated: 'remoteUserPositionUpdated',
	sceneCreated: 'sceneCreated',
	sceneDestroyed: 'sceneDestroyed',
    backgroundSizeUpdated: 'backgroundSizeUpdated',
    canvasResized: 'canvasResized',
};

export const fire = (eventName, ...optionalEventArgs) => {
    debugLog('events', "events.fire: eventName, args = ", eventName, optionalEventArgs);
	//fire an event by name
	//any subscribers will be notified
	//format: callback(...optionalArgsFromEvent, ...optionalArgsFromSubscriber)
	//returns number of subscribers
	if (_callbacksByEventName[eventName]) {
		const callbacks = _callbacksByEventName[eventName];
		if (callbacks && callbacks.length) {
			for (let i=0;i<callbacks.length;i++) {
				const callback = callbacks[i];
				const userArgs = _callbackArgsByEventName[eventName][i];
				if (typeof(optionalEventArgs) !== "undefined") {
					callback(...optionalEventArgs, ...userArgs.args);
				} else {
					callback(...userArgs.args);
				}
			}
			return callbacks.length;
		}
	}
	return 0;
};

export const subscribe = (eventName, callback, ...optionalArgs) => {
	//subscribe to events. 
	//returns event id to be used for unsubscribing
	if (!eventName) {
		console.error(`subscribe() failed to receive an eventName`, callback, ...optionalArgs);
		return null;
	}
	if (!callback) {
		console.error(`subscribe("${eventName}") failed to receive a valid callback`, eventName, ...optionalArgs);
		return null;
	}

	if (!_callbacksByEventName[eventName]) {
		//first time subscriber to this event
		_callbacksByEventName[eventName] = [];
		_callbackArgsByEventName[eventName] = [];
	}
	callback.___eventId = uuidv4(); //assign an id so we can unsubscribe later if necessary
	_callbacksByEventName[eventName].push(callback);
	let callbackArgs = { ___eventId: callback.___eventId, args: optionalArgs };
	_callbackArgsByEventName[eventName].push(callbackArgs);
	return callback.___eventId;
};

export const unsubscribe = (eventName, eventId) => {
	//unsubscribe from events. 
	//returns false if invalid params or no matching events found. True if an event was removed.
	if (!eventName) {
		console.log(`unsubscribe() failed to receive a valid eventName`, eventId);
		return false;
	}
	if (!eventId) {
		console.log(`unsubscribe("${eventName}") failed to receive a valid eventId`, eventName);
		return false;
	}

	if (!_callbacksByEventName[eventName]) {
		//no registered event handlers
		return false;
	}
	//remove matching events and args
	for (let i=0;i<_callbacksByEventName[eventName].length;i++){
		if (_callbacksByEventName[eventName].___eventId == eventId) {
			_callbacksByEventName[eventName].splice(i,1);
			_callbackArgsByEventName[eventName].splice(i,1);
			return true;
		}
	}
	return false;
};

// Subscribes to a single occurence of an event and then unsubscribes.  Can pass an optional predicate
// to specify if the event should be unsubscribed
export const subscribeOnce = (eventName, callback, predicate, ...optionalArgs) => {
	const subscriptionId = subscribe(eventName, (...args) => {
        if (!predicate || predicate(...args)) {
			unsubscribe(eventName, subscriptionId);
		}
		callback(...optionalArgs);
	}, ...optionalArgs);
};

