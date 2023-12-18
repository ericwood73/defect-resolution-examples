import { MeshBuilder, StandardMaterial, Texture, PointerDragBehavior, Color3 } from "babylonjs";
import { getScene } from "./scene";
import { getState, getCurrentUserId } from "./state";
import { debugLog } from "../common/util";
import { fire } from "./events";

let _localUserAvatar = null;

// Key is userId, value is avatar mesh
const _avatars = new Map();

export const createLocalAvatar = () => {
    const { initials } = getState('users', getCurrentUserId());
    _localUserAvatar = createAvatar(initials,
                        randomPosition({x: -5, y: -5}, {x: 5, y: 5}));
    addDragBehavior(_localUserAvatar);

    // Makes sure we send the initial position to the server
    _localUserAvatar.needsUpdate = true;
};

export const createRemoteAvatar = (userId) => {
    if (!userId) {
        console.warn('avatar.createRemoteAvatar: invalid userId');
        return;
    }

    const user = getState('users', userId);
    debugLog('avatar', "avatar.createRemoteAvatar: user = ", user);
    
    // If no user with this id, return
    if (!user) {
        console.warn('avatar.createRemoteAvatar: user not found');
        return;
    }

    // If an avatar already exists for this user, return
    if (_avatars.has(userId)) {
        return;
    }

    const { initials } = user;

    const position = getState('userPositions', userId)?.position;

    const avatar = createAvatar(initials, position, userId);
    if (avatar) {
        _avatars.set(userId, avatar);
        fire('remoteAvatarCreated', userId);
    } else {
        console.warn("avatar.createRemoteAvatar: failed to create avatar for user ", userId);
    }
};

export const getLocalUserAvatar = () => {
    return _localUserAvatar;
}

export const getRemoteUserAvatar = (userId) => {
    return _avatars.get(userId);
};

export const destroyAvatar = (userId) => {
    const avatar = _avatars.get(userId);
    avatar?.dispose();
    _avatars.delete(userId);
};

export const clearAvatars = () => {
    _avatars.forEach((avatar) => {
        avatar?.dispose();
    });
    _avatars.clear();
};

const createAvatar = (initials, position, userId) => {
    debugLog('avatar', "avatar.createAvatar: initials, position = ", initials, position);
    const avtMesh = MeshBuilder.CreateDisc(`${initials}_avt_mesh`, {
        radius: 1,
        tessellation: 64,
        updatable: true,
    }, getScene());

    const avtSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
                        <style>
                            svg { background-color: ${randomColor().toHexString()}; }
                        </style>
                        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" 
                            font-family="Arial, Helvetica, sans-serif" font-size="100px" font-weight="700">
                            ${initials}
                        </text>
                    </svg>`

    let base64SVG = btoa(unescape(encodeURIComponent(avtSvg)))

    let url = "data:image/svg+xml;base64," + base64SVG;

    const mat = new StandardMaterial(`${initials}_avt_mesh_mat`);
    const texture = new Texture(url);
    texture.vScale = -1;
    mat.diffuseTexture = texture;

    avtMesh.material = mat;

    if (position) {
        avtMesh.position.set(position.x, position.y, -1);
    }

    avtMesh.userId = userId;

    return avtMesh;
};

const addDragBehavior = (avatar) => {
    const dragBehavior = new PointerDragBehavior({dragPlaneNormal: BABYLON.Axis.Z});
    dragBehavior.onDragObservable.add((event) => {
        avatar.needsUpdate = true;
    });
    avatar.addBehavior(dragBehavior);
};

const randomColor = (min, max) => {
    return new Color3(Math.random(), Math.random(), Math.random());
};

const randomPosition = (min, max) => {
    const x = Math.random() * (max.x - min.x) + min.x;
    const y = Math.random() * (max.y - min.y) + min.y;
    return { x, y };
};


