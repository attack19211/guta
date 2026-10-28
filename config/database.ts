// config/database.ts

import mysql from 'mysql2/promise';
import { env } from '@/libs/env.lib';
import log from '@/config/logging';

export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    maxConnections: number;
    minConnections: number;
}

class DatabaseManager {
    private static instance: DatabaseManager;
    private _pool: mysql.Pool | null = null;
    private config: DatabaseConfig | null = null;

    private constructor() {}

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    private initPool(): mysql.Pool {
        if (this._pool) {
            return this._pool;
        }

        this.config = {
            host: env('DB_HOST', '127.0.0.1'),
            port: Number(env('DB_PORT', 3306)),
            user: env('DB_USERNAME', 'root'),
            password: env('DB_PASSWORD', ''),
            database: env('DB_DATABASE', 'attack'),
            maxConnections: Number(env('DB_MAX_CONNECTIONS', 20)),
            minConnections: Number(env('DB_MIN_CONNECTIONS', 2))
        };

        this._pool = mysql.createPool({
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database,
            connectionLimit: this.config.maxConnections,
            waitForConnections: true,
            queueLimit: 0,
            connectTimeout: Number(env('DB_CONNECTION_TIMEOUT', 30000)),
            idleTimeout: Number(env('DB_IDLE_TIMEOUT', 30000)),
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
        });

        return this._pool;
    }

    public get pool(): mysql.Pool {
        return this.initPool();
    }

    public async connectDB(): Promise<void> {
        try {
            const connection = await this.pool.getConnection();
            await connection.query('SELECT 1');
            connection.release();
        } catch (error: any) {
            log.error('An error has occurred:', { error: error.message });
            throw error;
        }
    }

    public async query<T = any>(
        sql: string,
        params: any[] = []
    ): Promise<T[]> {
        const start = Date.now();
        try {
            const [rows] = await this.pool.query(sql, params);
            const duration = Date.now() - start;

            if (duration > 100) {
                log.warning(`Slow queries need optimization (${duration}ms): ${sql.substring(0, 100)}`, { duration, sql: sql.substring(0, 100) });
            }

            return rows as T[];
        } catch (error: any) {
            log.error('An error has occurred:', { sql, params, error: error.message });
            throw error;
        }
    }

    public async execute(
        sql: string,
        params: any[] = []
    ): Promise<any> {
        const start = Date.now();
        try {
            const [result] = await this.pool.execute(sql, params);
            const duration = Date.now() - start;

            if (duration > 100) {
                log.warning(`Slow execution requires optimization (${duration}ms): ${sql.substring(0, 100)}`, { duration, sql: sql.substring(0, 100) });
            }

            return result;
        } catch (error: any) {
            log.error('An error has occurred:', { sql, params, error: error.message });
            throw error;
        }
    }

    public async getClient(): Promise<mysql.PoolConnection> {
        try {
            return await this.pool.getConnection();
        } catch (error: any) {
            log.error('An error has occurred:', { error: error.message });
            throw error;
        }
    }

    public async transaction<T>(
        callback: (client: mysql.PoolConnection) => Promise<T>
    ): Promise<T> {
        const connection = await this.getClient();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            log.info('Transaction processed successfully.');
            return result;
        } catch (error: any) {
            await connection.rollback();
            log.error('An error has occurred:', { error: error.message });
            throw error;
        } finally {
            connection.release();
        }
    }

    public async healthCheck(): Promise<boolean> {
        try {
            const connection = await this.pool.getConnection();
            await connection.query('SELECT 1');
            connection.release();
            return true;
        } catch (error: any) {
            log.error('An error has occurred:', { error: error.message });
            return false;
        }
    }

    public async disconnect(): Promise<void> {
        if (this._pool) {
            try {
                await this._pool.end();
                log.info('Database disconnection successful.');
            } catch (error: any) {
                log.error('An error has occurred:', { error: error.message });
            } finally {
                this._pool = null;
            }
        }
    }

    public getPool(): mysql.Pool {
        return this.pool;
    }

    public async createDatabase(dbName: string): Promise<void> {
        const connection = await mysql.createConnection({
            host: env('DB_HOST', '127.0.0.1'),
            port: Number(env('DB_PORT', 3306)),
            user: env('DB_USERNAME', 'root'),
            password: env('DB_PASSWORD', ''),
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.end();
    }
}

export const db = DatabaseManager.getInstance();
export default db;