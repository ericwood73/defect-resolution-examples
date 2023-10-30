// Normalizes an angle to be in the range [0, 2PI]
export const toStandardAngle = (inputAngle: number): number => {
    const twicePi: number = Math.PI * 2;
    if (inputAngle > 0 && inputAngle < twicePi) {
        // Already standard, so return
        return inputAngle
    }  
    return (inputAngle % twicePi + twicePi) % twicePi;
}

// Normalizes an angle to be in the range [-PI, PI]
export const toSignedAngle = (inputAngle: number): number => {
    if (inputAngle < 0 || inputAngle <= Math.PI) {
        // Already signed, so return
        return inputAngle
    }  
    return inputAngle - 2 * Math.PI;
}

// returns standard angle between min and max angles closest to the input angle
// Input, min, and max, can be signed or standard
export const getClosestAngle = (inputAngle: number, minAngle: number, maxAngle: number): number => {
    // Get input, min, and mx as standard angles
    inputAngle = toStandardAngle(inputAngle);
    minAngle = toStandardAngle(minAngle);
    maxAngle = toStandardAngle(maxAngle);

    const twicePi = Math.PI * 2;
    // Normalize the input angle to be within the range [0, 2*PI] degrees
    console.log("getClosestAngle angle inputs", inputAngle, minAngle, maxAngle);
    inputAngle = (inputAngle % twicePi + twicePi) % twicePi;
    console.log("normalized angle", inputAngle)

    if (minAngle > maxAngle) {
        if (inputAngle >= minAngle || inputAngle <= maxAngle) {
            return inputAngle;
        } else if (inputAngle > maxAngle && inputAngle < minAngle) {
            if (inputAngle >= (maxAngle + minAngle) / 2) {
                return minAngle;
            } else {
                return maxAngle;
            }
        }
    } else { // Handle the case where minAngle is less than or equal to maxAngle
        if (inputAngle >= minAngle && inputAngle <= maxAngle) {
            return inputAngle;
        } else if (inputAngle < minAngle || inputAngle > maxAngle) {
            if (inputAngle >= (minAngle + maxAngle) / 2) {
                return maxAngle;
            } else {
                return minAngle;
            }
        }
    }
    return inputAngle;
}

