// bootstrap/socket.bootstrap.ts

import { log } from '@/config/logging';

export const initializeSocket = ( io: any ) => {
    io.use(async (socket: any, next: any) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Unauthenticated'));
            }
            socket.data.user = { id: 'userId' };

            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: any) => {
        log.info('Socket connected', { socketId: socket.id });

        socket.on('disconnect', () => {
            log.info('Socket disconnected', { socketId: socket.id });
        });
    });
};