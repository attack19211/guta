// config/logging.ts

import fs from 'fs';
import path from 'path';
import { env } from '@/libs/env.lib';

export type LogLevel = 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug';

export interface LoggingConfig {
    default: string;
    channels: {
        [key: string]: {
            driver: string;
            level?: LogLevel;
            path?: string;
            days?: number;
        };
    };
}

class LoggingManager {
    private static instance: LoggingManager;
    private logPath: string;
    private logLevel: LogLevel;

    private constructor() {
        this.logPath = env('LOG_PATH', 'storage/logs/attack.log');
        this.logLevel = (env('LOG_LEVEL', 'debug') as LogLevel);
        this.ensureLogDirectory();
    }

    public static getInstance(): LoggingManager {
        if (!LoggingManager.instance) {
            LoggingManager.instance = new LoggingManager();
        }
        return LoggingManager.instance;
    }

    private ensureLogDirectory(): void {
        const dir = path.dirname(this.logPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private formatMessage(level: string, message: string, context?: any): string {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        let logMessage = `[${timestamp}] ${env('APP_ENV', 'local')}.${level}: ${message}`;
        
        if (context) {
            if (typeof context === 'object') {
                logMessage += ' ' + JSON.stringify(context);
            } else {
                logMessage += ' ' + String(context);
            }
        }
        
        return logMessage + '\n';
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];
        const currentIndex = levels.indexOf(this.logLevel);
        const messageIndex = levels.indexOf(level);
        return messageIndex >= currentIndex;
    }

    private writeLog(level: LogLevel, message: string, context?: any): void {
        if (!this.shouldLog(level)) {
            return;
        }

        try {
            const logMessage = this.formatMessage(level, message, context);
            fs.appendFileSync(this.logPath, logMessage);
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }

    public emergency(message: string, context?: any): void {
        this.writeLog('emergency', message, context);
    }

    public alert(message: string, context?: any): void {
        this.writeLog('alert', message, context);
    }

    public critical(message: string, context?: any): void {
        this.writeLog('critical', message, context);
    }

    public error(message: string, context?: any): void {
        this.writeLog('error', message, context);
    }

    public warning(message: string, context?: any): void {
        this.writeLog('warning', message, context);
    }

    public notice(message: string, context?: any): void {
        this.writeLog('notice', message, context);
    }

    public info(message: string, context?: any): void {
        this.writeLog('info', message, context);
    }

    public debug(message: string, context?: any): void {
        this.writeLog('debug', message, context);
    }

    public log(level: LogLevel, message: string, context?: any): void {
        this.writeLog(level, message, context);
    }

    public getLogPath(): string {
        return this.logPath;
    }

    public async getLogs(lines: number = 50): Promise<string[]> {
        try {
            const content = await fs.promises.readFile(this.logPath, 'utf-8');
            const logs = content.split('\n').filter(line => line.trim() !== '');
            return logs.slice(-lines);
        } catch (error) {
            return [];
        }
    }

    public async clear(): Promise<void> {
        try {
            await fs.promises.writeFile(this.logPath, '');
        } catch (error) {
            console.error('Failed to clear log:', error);
        }
    }
}

export const log = LoggingManager.getInstance();
export default log;