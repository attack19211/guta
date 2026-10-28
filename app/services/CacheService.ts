import Redis, { RedisOptions } from 'ioredis';
import fs from 'fs';
import path from 'path';
import log from '@/config/logging';

export class CacheService {
    private static instance: CacheService;
    private redisClient: Redis;
    private logDir: string;
    private logFile: string;

    private constructor() {
        this.logDir = path.join(process.cwd(), 'storage', 'framework', 'cache');
        this.logFile = path.join(this.logDir, 'cache.log');

        const redisConfig: RedisOptions = {
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            db: Number(process.env.REDIS_DB) || 0,
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                return Math.min(times * 50, 2000);
            },
            lazyConnect: false
        };

        this.redisClient = new Redis(redisConfig);
        this.redisClient.on('error', (err) => {
            log.error('[CacheService] Đã xảy ra lỗi kết nối Redis:', { error: err.message });
        });
    }

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    private writeCacheLog(action: string, key: string, status: 'SUCCESS' | 'FAIL' | 'HIT' | 'MISS', details: string = ''): void {
        setImmediate(() => {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] [${action.padEnd(13)}] [${status.padEnd(7)}] | Key: "${key}"${details ? ` | ${details}` : ''}\n`;

            fs.appendFile(this.logFile, logEntry, (err) => {
                if (err && err.code === 'ENOENT') {
                    fs.mkdir(this.logDir, { recursive: true }, () => {
                        fs.appendFile(this.logFile, logEntry, () => {});
                    });
                }
            });
        });
    }

    public async get<T = string>(key: string): Promise<T | null> {
        try {
            const data = await this.redisClient.get(key);
            if (!data) {
                this.writeCacheLog('GET', key, 'MISS', 'Data not found');
                return null;
            }

            this.writeCacheLog('GET', key, 'HIT', `Size: ${Buffer.byteLength(data, 'utf8')} bytes`);

            try {
                return JSON.parse(data) as T;
            } catch {
                return data as unknown as T;
            }
        } catch (error: any) {
            log.error(`[CacheService] Lỗi Get [Key: ${key}]:`, { error: error.message });
            this.writeCacheLog('GET', key, 'FAIL', `Error: ${error.message}`);
            return null;
        }
    }

    public async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        try {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

            let result: 'OK' | null;
            if (ttlSeconds && ttlSeconds > 0) {
                result = await this.redisClient.set(key, stringValue, 'EX', ttlSeconds);
            } else {
                result = await this.redisClient.set(key, stringValue);
            }

            const isSuccess = result === 'OK';
            if (isSuccess) {
                this.writeCacheLog('SET', key, 'SUCCESS', ttlSeconds ? `TTL: ${ttlSeconds}s` : 'TTL: Persistent');
            } else {
                this.writeCacheLog('SET', key, 'FAIL', 'Redis return non-OK status');
            }

            return isSuccess;
        } catch (error: any) {
            log.error(`[CacheService] Lỗi Set [Key: ${key}]:`, { error: error.message });
            this.writeCacheLog('SET', key, 'FAIL', `Error: ${error.message}`);
            return false;
        }
    }

    public async incr(key: string, ttlSeconds?: number): Promise<number> {
        try {
            let count: number;

            if (ttlSeconds && ttlSeconds > 0) {
                const luaScript = `
                    local current = redis.call('INCR', KEYS[1])
                    if tonumber(current) == 1 then
                        redis.call('EXPIRE', KEYS[1], ARGV[1])
                    end
                    return current
                `;
                count = await this.redisClient.eval(luaScript, 1, key, ttlSeconds) as number;
            } else {
                count = await this.redisClient.incr(key);
            }

            this.writeCacheLog('INCR', key, 'SUCCESS', `Current Value: ${count}${ttlSeconds ? ` | Expire TTL: ${ttlSeconds}s` : ''}`);
            return count;
        } catch (error: any) {
            log.error(`[CacheService] Lỗi Incr [Key: ${key}]:`, { error: error.message });
            this.writeCacheLog('INCR', key, 'FAIL', `Error: ${error.message}`);
            return 0;
        }
    }

    public async forget(key: string): Promise<boolean> {
        try {
            const count = await this.redisClient.del(key);
            const isSuccess = count > 0;
            this.writeCacheLog('FORGET', key, isSuccess ? 'SUCCESS' : 'MISS', `Keys removed: ${count}`);
            return isSuccess;
        } catch (error: any) {
            log.error(`[CacheService] Lỗi Forget [Key: ${key}]:`, { error: error.message });
            this.writeCacheLog('FORGET', key, 'FAIL', `Error: ${error.message}`);
            return false;
        }
    }

    public async del(key: string): Promise<boolean> {
        return this.forget(key);
    }

    public async expire(key: string, ttlSeconds: number): Promise<boolean> {
        try {
            const result = await this.redisClient.expire(key, ttlSeconds);
            const isSuccess = result === 1;
            this.writeCacheLog('EXPIRE', key, isSuccess ? 'SUCCESS' : 'MISS', `TTL: ${ttlSeconds}s`);
            return isSuccess;
        } catch (error: any) {
            log.error(`[CacheService] Lỗi Expire [Key: ${key}]:`, { error: error.message });
            this.writeCacheLog('EXPIRE', key, 'FAIL', `Error: ${error.message}`);
            return false;
        }
    }

    public async lock(key: string, ttlSeconds: number = 10): Promise<boolean> {
        try {
            const result = await this.redisClient.set(key, '1', 'EX', ttlSeconds, 'NX');
            const isAcquired = result === 'OK';

            if (isAcquired) {
                this.writeCacheLog('LOCK_ACQUIRE', key, 'SUCCESS', `TTL: ${ttlSeconds}s`);
            } else {
                this.writeCacheLog('LOCK_ACQUIRE', key, 'FAIL', 'Lock already held by another process');
            }

            return isAcquired;
        } catch (error: any) {
            log.error(`[CacheService] Lỗi Lock [Key: ${key}]:`, { error: error.message });
            this.writeCacheLog('LOCK_ACQUIRE', key, 'FAIL', `Error: ${error.message}`);
            return true;
        }
    }

    public async unlock(key: string): Promise<void> {
        try {
            await this.redisClient.del(key);
            this.writeCacheLog('LOCK_RELEASE', key, 'SUCCESS', 'Lock removed');
        } catch (error: any) {
            log.error(`[CacheService] Lỗi Unlock [Key: ${key}]:`, { error: error.message });
            this.writeCacheLog('LOCK_RELEASE', key, 'FAIL', `Error: ${error.message}`);
        }
    }
}