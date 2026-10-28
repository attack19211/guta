import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Command } from '../types';

export class KeyGenerateCommand implements Command {
    public name = 'key:generate';
    public description = 'Set the application key';

    public async execute(): Promise<void> {
        const key = 'base64:' + crypto.randomBytes(32).toString('base64');
        const envPath = path.join(process.cwd(), '.env');

        if (!fs.existsSync(envPath)) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m .env file not found.\n');
            return;
        }

        let envContent = fs.readFileSync(envPath, 'utf8');

        if (envContent.includes('APP_KEY=')) {
            envContent = envContent.replace(/APP_KEY=.*/, `APP_KEY=${key}`);
        } else {
            envContent += `\nAPP_KEY=${key}`;
        }

        fs.writeFileSync(envPath, envContent, 'utf8');

        console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m Application key set successfully.\n`);
    }
}