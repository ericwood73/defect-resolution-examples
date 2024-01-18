export const pixelsPerBabylonUnit = 120;

export const uuidv4 = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

export const isDebugEnabled = (debugKey) => {
	let debugOpts = {};
	// If we are on the browser
	if (typeof window !== 'undefined') {
	    // Value on window takes precedence
		debugOpts = window.debug;
	
		// Get the value from local storage if it's not on window
		if (!debugOpts) {
			debugOpts = JSON.parse(getLocalStorageValue('debug', '{}'));
		}

		window.debug = debugOpts;
	} else {
        // Get debug opts from the environment
		debugOpts = JSON.parse(process.env.DEBUG || '{}');
	}
		
	return debugOpts[debugKey];
};

export const debugLog = (debugKey, ...logMessages) => {
	// Log if the debug key is set to true
	if (isDebugEnabled(debugKey)) {
		const stackTrace = new Error().stack;
		// Get the second function in the stack trace, which is the function that called debugLog
        const firstFunctionTrace = stackTrace.split('\n')[2]; 
		console.log(...logMessages, firstFunctionTrace);
	}
};

export const getLocalStorageValue = (key, returnValueIfNotFound) => {
	if (typeof (Storage) !== "undefined") {
		let value = localStorage.getItem(key); //values are stored as strings
		if (value == null)
			return returnValueIfNotFound;
		let t = localStorage.getItem(key + '__type') || typeof returnValueIfNotFound; //back compat checking 
		let isBool = t === 'boolean';
		if (isBool)
			return value === 'true';
		return value;
	}
	return returnValueIfNotFound;
};



// Function to get an immutable snapshot of an object that can handle circular references
export const getImmutableSnapshot = (obj) => {
	const cache = new WeakMap();

	const clone = (value) => {
		if (value === null || typeof value !== 'object') {
			return value;
		}

		if (cache.has(value)) {
			return cache.get(value);
		}

		const isArray = Array.isArray(value);
		const clonedValue = isArray ? [] : {};

		cache.set(value, clonedValue);

		if (isArray) {
			value.forEach((item, index) => {
				clonedValue[index] = clone(item);
			});
		} else {
			Object.keys(value).forEach((key) => {
				clonedValue[key] = clone(value[key]);
			});
		}

		return clonedValue;
	};

	return clone(obj);
};
