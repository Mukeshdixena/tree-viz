import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
    autoConnect: true,
});

export const subscribeToUpdates = (callback) => {
    socket.on('dataUpdated', callback);
};

export const unsubscribeFromUpdates = () => {
    socket.off('dataUpdated');
};
