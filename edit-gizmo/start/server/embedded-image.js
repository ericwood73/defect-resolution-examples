import { pushState, pushToAll } from "./websocket.js";
import { debugLog, uuidv4 } from '../common/util.js';
import { serverEventNames } from '../common/server-event-names.js';

const flickrOembedUrl = 'https://www.flickr.com/services/oembed/';

const _embeddedImages = {};

const getFlickrOembedProfile = async (imageUrl) => {
    const url = `${flickrOembedUrl}?url=${imageUrl}&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to get oembed profile for image url ${url} response: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}


export const createEmbeddedImage = async ( userId, { roomId, imageUrl }) => {
    // Get the oembed data from the API
    const oembedProfile = await getFlickrOembedProfile(imageUrl);
    debugLog('In createEmbeddedImage, oembedProfile: ', oembedProfile);

    // Create the embedded image object
    const embeddedImage = {
        id: uuidv4(),
        roomId,
        url: oembedProfile.url,
        widthPx: oembedProfile.width,
        heightPx: oembedProfile.height,
        title: oembedProfile.title,
    };

    _embeddedImages[embeddedImage.id] = embeddedImage;

    // Push the embedded image state
    pushState([{
        stateKey: 'embeddedImages',
        entityId: embeddedImage.id,
        data: embeddedImage
    }]);

    // Push the embedded image to all clients
    pushToAll(serverEventNames.embeddedImageCreated, { userId, roomId, imageId: embeddedImage.id });
};

export const updateEmbeddedImage = async (userId, { imageId, positionX, positionY, 
                                          width, height }) => {
    const embeddedImage = _embeddedImages[imageId];
    if (!embeddedImage) {
        console.warn(`In updateEmbeddedImage - failed to find embedded image with id "${imageId}"`);
        return;
    }

    // Update the embedded image
    embeddedImage.positionX = positionX;
    embeddedImage.positionY = positionY;
    embeddedImage.width = width;
    embeddedImage.height = height;

    // Push the embedded image state
    pushState([{
        stateKey: 'embeddedImages',
        entityId: embeddedImage.id,
        data: embeddedImage
    }]);

    // Push the embedded image to all clients
    pushToAll(serverEventNames.embeddedImageUpdated, 
              { userId, roomId: embeddedImage.roomId, imageId: embeddedImage.id });
};

export const getEmbeddedImages = () => {
    return _embeddedImages;
};