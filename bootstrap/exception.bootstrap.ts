// bootstrap/exception.bootstrap.ts
import { logError } from '@/libs/logger.lib';

export const registerExceptionHandlers = (): void => {
    process.on('uncaughtException', (err) => {
        logError('Uncaught Exception', { error: err });
    });

    process.on('unhandledRejection', (reason) => {
        logError('Unhandled Rejection', {
            error: reason instanceof Error ? reason : { message: String(reason) }
        });
    });
};