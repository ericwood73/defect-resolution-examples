import { 
    Vector3, MeshBuilder, StandardMaterial, NodeMaterial, ActionManager,
    ExecuteCodeAction, Observable, Animation, AnimationGroup, FadeInOutBehavior 
} from 'babylonjs';

import _defaultButtonSvg from './assets/boost-default.svg?raw';
import _hoveredButtonSvg from './assets/boost-hovered.svg?raw';
import _pressedButtonSvg from './assets/boost-pressed.svg?raw';

import _cooldownMaterialJson from './assets/cooldownMaterial.json';

import { eventNames, subscribe } from './events';
import { getCurrentUserId, getState } from './state';
import { getCurrentRoomId } from './room-state';
import { getRemoteUserAvatar } from './avatar';
import { getScene } from './scene';
import { getImmutableSnapshot } from '../common/util';

// These are cached only for the current scene (room)
// This is the base mesh for the UI that will be instanced for each avatar mesh
let _baseBoostUIMesh = null;  

const _uiStates = {
    default: {
        svg: _defaultButtonSvg,
        texture: null
    },
    hovered: {
        svg: _hoveredButtonSvg,
        texture: null
    },
    pressed: {
        svg: _pressedButtonSvg,
        texture: null
    },
};

let _boostReady = false;

export const _init = async () => {
    

    // Subscribe to scene ready for current room and any future rooms joined
    subscribe(eventNames.sceneCreated, initializeForScene);

    // Handle scene destroy
    subscribe(eventNames.sceneDestroyed, () => _boostReady = false);
 
    // Create for any users that may join
    subscribe(eventNames.remoteAvatarCreated, getOrCreateBoostUI);

    // If we missed the scene ready, initialize the base UI mesh.
    const scene = getScene()
    if (!_baseBoostUIMesh && scene) {
        initializeForScene(scene);
    }
};

const initializeForScene = (scene) => {
    initStates();

    _baseBoostUIMesh = createBaseBoostUI(scene);
    _boostReady = true;
        
    // Create for all existing remote users
    const currentRoom = getState('rooms', getCurrentRoomId());
    currentRoom.users.forEach(userId => getOrCreateBoostUI(userId));

    // Create for any users that may join
    subscribe(eventNames.remoteAvatarCreated, getOrCreateBoostUI);  
};

const initStates = () => {
    initState(_uiStates.default);
    initState(_uiStates.hovered);
    initState(_uiStates.pressed);
};

const initState = (state) => {
    state.texture = createTexture(state.svg);
};

const setState = (boostUI, state) => {
    // Hack to workaround the pointer out being triggered twice when the pointer leaves the boostUI
    // due to a bug in babylonjs.  See https://forum.babylonjs.com/t/triggering-pointer-out-actions-when-camera-change-causes-pointer-to-exit-mesh/39061/12
    // Can be removed once we upgrade to a babylonjs release containing PR #13661
    if (!boostUI.isBoostUI) {
        return;
    }
    boostUI.material.diffuseTexture = state.texture;
};

// Create a base UI that will be instanced for each remote user
const createBaseBoostUI = (scene) => {
    const boostUIMesh = MeshBuilder.CreateDisc('boostUI', {
        radius: 1/5,
        tessellation: 64,
        updatable: true,
    }, scene);

    const boostUIZOffset = -.001;
    const defaultPosition = new Vector3(-0.8, 0.5, boostUIZOffset);
    boostUIMesh.position.copyFrom(defaultPosition);

    boostUIMesh.material = new StandardMaterial(`boostUI_mat`);

    setState(boostUIMesh, _uiStates.default);

    // Disable the base UI
    boostUIMesh.setEnabled(false);

    boostUIMesh.cooldownMesh = createBaseCooldownMesh(boostUIMesh, scene);
    return boostUIMesh;        
};

const createTexture = (svg) => {
	const base64SVG = window.btoa(unescape(encodeURIComponent(svg)));
	const url = "data:image/svg+xml;base64," + base64SVG;
	const texture = new BABYLON.Texture(url);
    texture.vScale = -1;
    return texture;      
};

const createBaseCooldownMesh = (boostUIMesh, scene) => {
    const cooldownMesh = MeshBuilder.CreateDisc(`cooldown`, {
        radius: 1/5,
        tessellation: 64
    }, scene);
    cooldownMesh.parent = boostUIMesh;
    cooldownMesh.position.z = -0.001;
    cooldownMesh.rotation.z = Math.PI/-2.0;

    // Set the material
    cooldownMesh.material = createBaseCooldownMaterial(scene);

    // Disable the base cooldown mesh
    cooldownMesh.setEnabled(false);

    return cooldownMesh;
};

const createBaseCooldownMaterial = (scene) => {
    return NodeMaterial.Parse(_cooldownMaterialJson, scene);
};

const getOrCreateBoostUI = (usrId) => {
    if (!_boostReady) {
        return;    
    }

    if (usrId === getCurrentUserId()) {
        // Don't create UI for current user
        return;
    }

    const avtMesh = getRemoteUserAvatar(usrId);
    if (!avtMesh) {
        console.warn("In boost.getOrCreateBoostUI - avatar mesh not found for usrId: ", usrId);
        return;
    }
    
    if (!avtMesh.boostUI) {
        createForAvatar(usrId, avtMesh);
    }

    return avtMesh.boostUI;
};

const createForAvatar = (usrId, avtMesh) => {
    const boostUIMesh = createBoostUI(avtMesh);
    boostUIMesh.actionManager = new ActionManager();
    // Register the click action
    boostUIMesh.actionManager.registerAction(new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        () => handleClick(usrId)
    ));

    // Register the hovered/unhovered actions
    boostUIMesh.actionManager.registerAction(new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        (e) => {
            // We need to get the boostUI from the event rather than relying on 
            // the boostUIMesh which could be the wrong boost UI somehow.
            const boostUI = e.meshUnderPointer;
            if (!boostUI.onCooldown) {
                setState(boostUI, _uiStates.hovered);
            } 
        }
    ));
    boostUIMesh.actionManager.registerAction(new ExecuteCodeAction(
        ActionManager.OnPointerOutTrigger,
        (e) => {
            // We need to get the boostUI from the event rather than relying on 
            // the boostUIMesh which could be the wrong boost UI somehow.
            const boostUI = e.meshUnderPointer;
            setState(boostUI, _uiStates.default);
        }
    ));

    // Register the pressed action
    boostUIMesh.actionManager.registerAction(new ExecuteCodeAction(
        ActionManager.OnPickDownTrigger,
        (e) => {
            // We need to get the boostUI from the event rather than relying on 
            // the boostUIMesh which could be the wrong boost UI somehow.
            const boostUI = e.meshUnderPointer;
            setState(boostUIMesh, _uiStates.pressed);
        }
    ));
    
    avtMesh.boostUI = boostUIMesh;

    // Register show/hide actions for boostUI
    registerShowHideActions(avtMesh);
};

const createBoostUI = (avatarMesh) => {
    // Create a boost ui for this avatar by cloning the base
    let boostUIInstance, cooldownInstance;
    const boostUIMesh = _baseBoostUIMesh.instantiateHierarchy(
        avatarMesh, // New parent
        {doNotInstantiate: true}, // Options
        // Capture the new instances
        (source, clone) => {
            if (source === _baseBoostUIMesh) {
                boostUIInstance = clone;
            } else if (source === _baseBoostUIMesh.cooldownMesh) {
                cooldownInstance = clone;
            } 
            clone.material = source.material.clone();    
        });

    // Add an observable for cooldown
    boostUIInstance.onCooldownCompleteObservable = new Observable();

    // Connect instances
    boostUIInstance.cooldownMesh = cooldownInstance;    

    boostUIInstance.setEnabled(true);

    // Hack to workaround the pointer out being triggered twice when the pointer leaves the boostUI
    // due to a bug in babylonjs.  See https://forum.babylonjs.com/t/triggering-pointer-out-actions-when-camera-change-causes-pointer-to-exit-mesh/39061/12
    // Can be removed once we upgrade to a babylonjs release containing PR #13661
    boostUIInstance.isBoostUI = true;

    return boostUIInstance;
};

const handleClick = (usrId, onCooldownComplete) => {
    startCooldown(usrId, 10, onCooldownComplete);
};

const startCooldown = (usrId, cooldownTime) => {
    const scene = getScene();
    const boostUI = getOrCreateBoostUI(usrId);
    if (!boostUI) {
        console.error("Failed to retireve boostUI for usr ", usrId);
    }

    // Revert to default state
    setState(boostUI, _uiStates.default);
    boostUI.onCooldown = true;

    const cooldownMesh = boostUI.cooldownMesh;
    const cooldownRemainingInput = cooldownMesh.material.getBlockByName("cooldownRemaining");
    
    // create animation clip
    const cooldownAnim = new Animation("cooldownAnim", "value", 60, 
            Animation.ANIMATIONTYPE_FLOAT, 
            Animation.ANIMATIONLOOPMODE_CONSTANT);

    // Animation keyframe
    const cooldownAnimationKeyFrames = [
        {frame: 0, value: 1},
        {frame: 60*cooldownTime, value: 0}
    ];

    cooldownAnim.setKeys(cooldownAnimationKeyFrames);
    
    // set up animation groups
    const cooldownAnimGroup = new AnimationGroup("cooldownAnimGroup", scene);
    cooldownAnimGroup.addTargetedAnimation(cooldownAnim, cooldownRemainingInput);
    cooldownMesh.setEnabled(true);
    cooldownAnimGroup.play(false);
    cooldownAnimGroup.onAnimationEndObservable.add(() => {
        cooldownMesh.setEnabled(false);
        cooldownAnimGroup.dispose();
        boostUI.onCooldown = false;
        if (boostUI.getScene().meshUnderPointer === boostUI) {
            // Set the state to hovered
            setState(boostUI, _uiStates.hovered);
        } 
        boostUI.onCooldownCompleteObservable.notifyObservers();
    });
};

const registerShowHideActions = (avatarMesh) => {
    if (!avatarMesh.actionManager) {
        avatarMesh.actionManager = new ActionManager();
    }

    const scene = getScene();

    // Add a fade out behavior
    //const fadeBehavior = new FadeInOutDelayBehavior();
    const fadeBehavior = new FadeInOutBehavior();
    fadeBehavior.fadeOutDelay = 1000;
    avatarMesh.boostUI.addBehavior(fadeBehavior);

    // Create an action for enabling the boost ui
    const enableAction = new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        () => fadeBehavior.fadeIn()
    );
    
    // Enable on pointer over
    avatarMesh.actionManager.registerAction(enableAction);

    // Also register action with boostUI so the boostUI becomes visible when the 
    // pointer is over it.  Otherwise, the boost ui would mask the pointer event 
    // on the avatar mesh.  We could use isRecursive on the avatar action 
    // manager, but we don't want pointer outs to be recursive and we may not 
    // want other child actions to be triggered on the avatar
    avatarMesh.boostUI.actionManager.registerAction(enableAction);

    // Create an action for disabling the boostUI.  We use a setTimeout 0 here 
    // because the pointer out is fired for the current mesh before the pointer 
    // over is fired.  Note that we need to be able to create the action with 
    // different meshes to check for the avatar and the boostUI as described below
    const getDisableAction = (checkMesh) => {
        return new ExecuteCodeAction(
            ActionManager.OnPointerOutTrigger,
            () => setTimeout(() => {
                if (scene.meshUnderPointer !== checkMesh &&
                    avatarMesh.boostUI && 
                    avatarMesh.boostUI.visibility > 0) {
                    fadeBehavior.fadeOut();
                }
            }, 0)
        );
    };

    // Disable on pointer out
    avatarMesh.actionManager.registerAction(getDisableAction(avatarMesh.boostUI));

    // Hovering the boostUI will trigger the pointer out on the avatar mesh 
    // (becasue the boostUI has it's own actionManager) which will trigger the child mesh to hide.  
    // By doing the disable check in a setTimeout 0 above, we prevent that; however,
    // we have to handle the case where the pointer leaves the boostUI and is not
    // over the avatar.  Register the disable action with the boostUI action manager for this.
    avatarMesh.boostUI.actionManager.registerAction(getDisableAction(avatarMesh));
};