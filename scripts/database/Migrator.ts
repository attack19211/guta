import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import db from '@/config/database';
import env from '@/libs/env.lib';

export interface MigrationRecord {
    id: number;
    migration: string;
    batch: number;
}

export class Migrator {
    public static readonly infoBadge = '\x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m';
    public static readonly warnBadge = '\x1b[43m\x1b[30m\x1b[1m WARN \x1b[0m';

    public static printInfo(message: string): void {
        console.log(`\n   ${this.infoBadge}  ${message}\n`);
    }

    public static printTaskLine(label: string, durationMs: number, targetWidth: number = 120): void {
        const timeStr = `${durationMs}ms`;
        const doneStr = '\x1b[32mDONE\x1b[0m';
        const dotsCount = Math.max(2, targetWidth - label.length - timeStr.length - 7);
        const dots = '.'.repeat(dotsCount);

        console.log(`  ${label} ${dots} ${timeStr} ${doneStr}`);
    }

    public static printStatusLine(label: string, statusText: string, targetWidth: number = 120): void {
        const dotsCount = Math.max(2, targetWidth - label.length - statusText.length - 2);
        const dots = '.'.repeat(dotsCount);

        console.log(`  ${label} ${dots} ${statusText}`);
    }

    public static async ensureDatabaseExists(): Promise<void> {
        try {
            await db.execute('SELECT 1');
        } catch (error: any) {
            if (error.code === 'ER_BAD_DB_ERROR' || error.errno === 1049) {
                const dbName = env("DB_DATABASE", "attack");
                const connectionName = env("DB_CONNECTION", "mysql");

                console.log(`\n  ${this.warnBadge} The database '${dbName}' does not exist on the '${connectionName}' connection.\n`);

                const rl = readline.createInterface({ input, output });
                const answer = await rl.question('  Would you like to create it? (yes/no) [no]\n  \x1b[32m❯\x1b[0m ');
                rl.close();

                const confirmed = ['yes', 'y'].includes(answer.trim().toLowerCase());

                if (confirmed) {
                    await db.createDatabase(dbName);
                    console.log('');
                } else {
                    process.exit(1);
                }
            } else {
                throw error;
            }
        }
    }

    public static async hasMigrationsTable(): Promise<boolean> {
        try {
            await db.execute('SELECT 1 FROM `migrations` LIMIT 1');
            return true;
        } catch {
            return false;
        }
    }

    public static async ensureMigrationsTable(): Promise<boolean> {
        const exists = await this.hasMigrationsTable();
        if (exists) return false;

        const sql = `
            CREATE TABLE IF NOT EXISTS \`migrations\` (
                \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                \`migration\` VARCHAR(255) NOT NULL,
                \`batch\` INT NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        await db.execute(sql);
        return true;
    }

    public static getMigrationFiles(): string[] {
        const migrationsDir = path.join(process.cwd(), 'database/migrations');
        if (!fs.existsSync(migrationsDir)) return [];
        return fs.readdirSync(migrationsDir)
            .filter((file: string) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'))
            .sort();
    }

    public static async getRanMigrations(): Promise<MigrationRecord[]> {
        const exists = await this.hasMigrationsTable();
        if (!exists) return [];
        const result = await db.execute('SELECT * FROM `migrations` ORDER BY `id` ASC');
        return (result.rows || result) as MigrationRecord[];
    }

    public static async getNextBatchNumber(): Promise<number> {
        const ran = await this.getRanMigrations();
        if (ran.length === 0) return 1;
        const maxBatch = Math.max(...ran.map(m => m.batch));
        return maxBatch + 1;
    }

    public static async loadMigrationClass(fileName: string): Promise<any> {
        const filePath = path.join(process.cwd(), 'database/migrations', fileName);
        const fileUrl = pathToFileURL(filePath).href; // Convert 'D:\...' -> 'file:///D:/...'
        const module = await import(fileUrl);
        return new module.default();
    }

    public static async dropAllTables(): Promise<void> {
        const dbName = process.env.DB_DATABASE || 'attack';

        await db.execute('SET FOREIGN_KEY_CHECKS = 0');

        const result = await db.execute(
            'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
            [dbName]
        );
        const rows = (result.rows || result) as any[];

        for (const row of rows) {
            const tableName = row.TABLE_NAME || row.table_name;
            if (tableName) {
                await db.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
            }
        }

        await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    }
}