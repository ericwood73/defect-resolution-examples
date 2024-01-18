import { createEmbeddedImage } from './embedded-image.js';
import { fire, eventNames } from './events.js';

let editToolbar;
let editModeButton;  
let addImageButton;
let addImageModal;
let addImageModalImageInput;

// Edit mode state
let editModeEnabled = false;

export const _init = () => {
    editToolbar = document.getElementById('edit-toolbar');
    editModeButton = document.getElementById('edit-mode-button');
    addImageButton = document.getElementById('add-image-button');
    addImageModal = document.getElementById('add-image-modal');
    addImageModalImageInput = document.getElementById('add-image-url-input');
    const addImageModalAddButton = document.querySelector('#add-image-form button');
    const addImageModalCloseButton = document.getElementById('add-image-cancel');

    editModeButton.addEventListener('click', handleEditModeChange);
    addImageButton.addEventListener('click', handleAddImage);

    addImageModalAddButton.addEventListener('click', handleAddImageModalAdd);
    addImageModalCloseButton.addEventListener('click', handleAddImageModalClose);
}

const handleEditModeChange = () => {
    if (editModeEnabled) {
        editModeEnabled = false;
        editToolbar.classList.remove('edit-mode-enabled');
        editToolbar.classList.add('edit-mode-disabled');
    } else {
        editModeEnabled = true;
        editToolbar.classList.remove('edit-mode-disabled');
        editToolbar.classList.add('edit-mode-enabled');
    }
    fire(eventNames.editModeChanged, editModeEnabled);
}

const handleAddImage = () => {
    // Show the Add Image Modal
    addImageModal.classList.remove('hidden');
}

const handleAddImageModalAdd = () => {
    const imageUrl = addImageModalImageInput.value;
    // Create the embedded image
    createEmbeddedImage(imageUrl);
    // Hide the Add Image Modal
    addImageModal.classList.add('hidden');
}

const handleAddImageModalClose = () => {
    // Hide the Add Image Modal
    addImageModal.classList.add('hidden');
}
    