// libs/logger.lib.ts
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'storage', 'logs');

type LogLevel = 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug';

const ensureLogDir = (): void => {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
};

const getLogFilePath = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return path.join(LOG_DIR, `attack-${yyyy}-${mm}-${dd}.log`);
};

const formatTimestamp = (): string => {
    const d = new Date();
    const parts = new Intl.DateTimeFormat('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(d);

    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
};

const serialize = (ctx: Record<string, any>): string => {
    try {
        return JSON.stringify(ctx, (_k, v) => {
            if (v instanceof Error) {
                return { message: v.message, name: v.name, stack: v.stack };
            }
            return v;
        }, 2);
    } catch {
        return '[Unserializable Context]';
    }
};

export const writeLog = (level: LogLevel, message: string, context?: Record<string, any>): void => {
    try {
        ensureLogDir();
        const line =
            `[${formatTimestamp()}] ${level.toUpperCase()}: ${message}` +
            (context ? ` ${serialize(context)}` : '') +
            '\n';
        fs.appendFileSync(getLogFilePath(), line, { encoding: 'utf8' });
    } catch (e) {
        console.error('[logger.lib] Đã xảy ra lỗi ghi nhật ký:', e);
    }
};

export const logError = (message: string, context?: Record<string, any>) => writeLog('error', message, context);
export const logWarning = (message: string, context?: Record<string, any>) => writeLog('warning', message, context);
export const logInfo = (message: string, context?: Record<string, any>) => writeLog('info', message, context);