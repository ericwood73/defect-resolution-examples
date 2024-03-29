import { serverEventNames } from "../common/server-event-names.js";
import { pushState, pushToAll } from "./websocket.js";

const defaultRoom = {
    name: "First Room",
    backgroundImageUrl: "https://i.imgur.com/NuUNkyo.jpg"
};

const room2 = {
    name: "Second Room",
    backgroundImageUrl: "https://i.imgur.com/Ig3Z6A7.jpg"
};


const rooms = { defaultRoom, room2 }

export const getRooms = () => {
    return rooms;
};

// Join the specified room or the default room if no room id is specified
export const joinRoom = async (userId, { roomId = 'defaultRoom' } = {}) => {
    const currentRoom = getCurrentRoom(userId);
    
    const room = rooms[roomId];
    if (!room) {
        console.error(`joinRoom() failed to find room with id "${roomId}"`);
        return;
    }
    
    if (currentRoom) {
        // Don't join the room if we're already in it
        if (currentRoom.id === roomId) {
            return;
        } else {
            // Leave the current room
            leaveRoom(userId);
        }
    } 

    if (!room.users) {
        room.users = [];
    };
    room.users.push(userId);
    const roomsToPush = [roomId];
    if (currentRoom) {
        roomsToPush.push(currentRoom.id);
    }
    pushRoomStates(roomsToPush);
    pushToAll(serverEventNames.userJoinedRoom, { userId, roomId });
};

export const leaveRoom = (userId) => {
    const currentRoom = getCurrentRoom(userId);
    if (currentRoom) {
        console.log("In room.leaveRoom - currentRoom: ", currentRoom);
        currentRoom.users = currentRoom.users.filter(id => id !== userId);
        pushRoomStates([currentRoom.id]);
        pushToAll(serverEventNames.userLeftRoom, { userId, roomId: currentRoom.id });
    }
};

const getCurrentRoom = (userId) => {
    for(const roomId in rooms) {
        const room = rooms[roomId];
        if(room.users && room.users.includes(userId)) {
            return room;
        }
    }
    return null;
};

const pushRoomStates = (roomIds) => {
    pushState(roomIds.map(roomId => ({
        stateKey: 'rooms',
        entityId: roomId,
        data: rooms[roomId]
    })));
};

