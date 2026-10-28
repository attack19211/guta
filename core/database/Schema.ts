// core/database/Schema.ts

import db from '@/config/database';
import { Blueprint } from './Blueprint';

export class Schema {
    public static async create(
        tableName: string,
        callback: (table: Blueprint) => void
    ): Promise<void> {
        const blueprint = new Blueprint();
        callback(blueprint);

        const sql = blueprint.toSQL(tableName);
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            await db.execute(statement);
        }
    }

    public static async table(
        tableName: string,
        callback: (table: Blueprint) => void
    ): Promise<void> {
        const blueprint = new Blueprint();
        callback(blueprint);

        const sql = blueprint.toSQL(tableName);
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            await db.execute(statement);
        }
    }

    public static async raw(sql: string): Promise<void> {
        await db.execute(sql);
    }

    public static async drop(tableName: string): Promise<void> {
        const sql = `DROP TABLE \`${tableName}\`;`;
        await db.execute(sql);
    }

    public static async dropIfExists(tableName: string): Promise<void> {
        const sql = `DROP TABLE IF EXISTS \`${tableName}\`;`;
        await db.execute(sql);
    }

    public static async hasTable(tableName: string): Promise<boolean> {
        try {
            const sql = `SELECT 1 FROM \`${tableName}\` LIMIT 1;`;
            await db.execute(sql);
            return true;
        } catch {
            return false;
        }
    }

    public static async rename(fromTableName: string, toTableName: string): Promise<void> {
        const sql = `RENAME TABLE \`${fromTableName}\` TO \`${toTableName}\`;`;
        await db.execute(sql);
    }

    public static async disableForeignKeyConstraints(): Promise<void> {
        await db.execute('SET FOREIGN_KEY_CHECKS = 0;');
    }

    public static async enableForeignKeyConstraints(): Promise<void> {
        await db.execute('SET FOREIGN_KEY_CHECKS = 1;');
    }
}