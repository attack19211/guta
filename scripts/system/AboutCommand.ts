import fs from 'fs';
import path from 'path';
import { Command } from '../types';
import { env } from '@/libs/env.lib';

export class AboutCommand implements Command {
    public name = 'about';
    public description = 'Display basic information about the application';

    public async execute(): Promise<void> {
        let version = '1.0.0';
        try {
            const pkgPath = path.join(process.cwd(), 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                if (pkg.version) {
                    version = pkg.version;
                }
            }
        } catch {
        }

        const appName = env('APP_NAME', 'ATTACK Framework');
        const environment = env('APP_ENV', 'local');
        const debugMode = env('APP_DEBUG', true) ? '\x1b[32mENABLED\x1b[0m' : '\x1b[31mDISABLED\x1b[0m';
        const url = env('APP_BASE_URL', 'http://localhost');
        const dbConnection = env('DB_CONNECTION', 'mysql');

        const termWidth = Math.min(process.stdout.columns || 120, 120);

        const printSectionHeader = (title: string) => {
            const dots = '.'.repeat(Math.max(2, termWidth - title.length - 2));
            console.log(`\n  \x1b[32m${title}\x1b[0m \x1b[90m${dots}\x1b[0m`);
        };

        const printRow = (label: string, value: string) => {
            const cleanValue = value.replace(/\x1b\[[0-9;]*m/g, '');
            const dotsCount = Math.max(2, termWidth - label.length - cleanValue.length - 4);
            const dots = '.'.repeat(dotsCount);
            console.log(`  ${label} \x1b[90m${dots}\x1b[0m \x1b[1m${value}\x1b[0m`);
        };

        const printStatusRow = (label: string, status: string = 'NOT CACHED') => {
            printRow(label, `\x1b[33m${status}\x1b[0m`);
        };

        printSectionHeader('Environment');
        printRow('Application Name', appName);
        printRow('ATTACK Version', version);
        printRow('NODE Version', process.version);
        printRow('Environment', environment);
        printRow('Debug Mode', debugMode);
        printRow('URL', url);
        printRow('Maintenance Mode', 'OFF');

        printSectionHeader('Cache');
        printStatusRow('Config');
        printStatusRow('Events');
        printStatusRow('Routes');
        printStatusRow('Views');

        printSectionHeader('Drivers');
        printRow('Broadcasting', 'log');
        printRow('Cache', 'file');
        printRow('Database', dbConnection);
        printRow('Logs', 'stack / single');
        printRow('Mail', 'smtp');
        printRow('Queue', 'sync');
        printRow('Session', 'file');

        console.log('');
    }
}