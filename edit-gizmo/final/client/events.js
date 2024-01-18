import { serverEventNames } from '../common/server-event-names.js';
import { debugLog, uuidv4 } from '../common/util.js';

const _callbacksByEventName = {};		//key: event name, value: array of callback functions
const _eventSubscriptionDetailsById = {}; //key: subscriptionId, value: subscription options

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
	editModeChanged: 'editModeChanged',
	boostInitiated: 'boostInitiated',
	boostExpired: 'boostExpired',
};

export const fire = (eventName, ...optionalEventArgs) => {
    debugLog('events', "events.fire: eventName, args = ", eventName, optionalEventArgs);
	//fire an event by name
	//any subscribers will be notified
	//format: callback(...optionalArgsFromEvent, ...optionalArgsFromSubscriber)
	//returns number of subscribers

	// List of subscriptions to be removed for the event.
	// This needs to be done after all subscriptions have been notified to
	// prevent concurrent modification of the subscriptions list while iterating it
	const subscriptionsToRemove = [];
	const removeSubscription = unsubscribe.bind(null, eventName);

	if (_callbacksByEventName[eventName]) {
		const callbacks = _callbacksByEventName[eventName];
		if (callbacks && callbacks.length) {
			for (let i=0;i<callbacks.length;i++) {
				const callback = callbacks[i];

				const { predicate, removeAfterEvent, optionalArgs: userArgs } = 
				        _eventSubscriptionDetailsById[callback.subscriptionId] || {};

				// If predicate is defined, test and skip the callback if it is false
				if (predicate && !predicate(...optionalEventArgs)) {
					continue;
				}

				// If we are to remove the subscription, add it to the list here
				if (removeAfterEvent) {
					subscriptionsToRemove.push(callback.subscriptionId);
				}
				
				if (typeof(optionalEventArgs) !== "undefined") {
					callback.callback(...optionalEventArgs, ...userArgs);
				} else {
					callback.callback(...userArgs);
				}
			}

			// Remove any subscriptions that should be removed
            subscriptionsToRemove.forEach(removeSubscription);

			return callbacks.length;
		}
	}
	return 0;
};

export const subscribe = (eventName, callback, ...optionalArgs) => {
	// Call the advanced subscribe method with default options
	return subscribeAdvanced(eventName, callback, {}, ...optionalArgs);
};

// Declare a new method rather than overloading subscribe() to avoid breaking existing code
export const subscribeAdvanced = (eventName, callback, {  
	predicate = null, // Condition to test for true before calling the subscription callback
	removeAfterEvent = false, // Remove the subscription once the callback is called
} = {}, ...optionalArgs) => { 
	//subscribe to game events. 
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
	}

	const subscriptionId = uuidv4(); //assign an id so we can unsubscribe later if necessary
	
	// Add the subscription id along with the callback, so we can retrieve the
	// subscription details.  
	_callbacksByEventName[eventName].push({ subscriptionId, callback });
	_eventSubscriptionDetailsById[subscriptionId] = {
		eventName,
		predicate,
		removeAfterEvent,
		optionalArgs
	};
	return subscriptionId;
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
		if (_callbacksByEventName[eventName][i].___eventId == eventId) {
			_callbacksByEventName[eventName].splice(i,1);
			return true;
		}
	}
	return false;
};

// Subscribes to a single occurence of an event and then unsubscribes.  Can pass an optional predicate
// to specify if the event should be unsubscribed
export const subscribeOnce = (eventName, callback, predicate, ...optionalArgs) => {
	return subscribeAdvanced(eventName, callback, { 
		predicate, removeAfterEvent: true 
	}, ...optionalArgs);
};

