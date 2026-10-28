// bootstrap/shutdown.bootstrap.ts

import db from '@/config/database';

export const gracefulShutdown = async ( server: any ) => {
    try {
        await db.disconnect();

        server.close(() => {
            process.exit(0);
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};