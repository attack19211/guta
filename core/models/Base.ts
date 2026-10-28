// core/models/Base.ts

import { Builder } from '@/core/models/Builder';
import { PoolConnection } from 'mysql2/promise';

export type ModelConstructor<T extends Base = Base> = {
    new (attributes?: Record<string, any>): T;
    tableName: string;
    fillable: string[];
    hidden?: string[];
    primaryKey: string;
    casts?: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array'>;
    query(): Builder<Record<string, any>>;
};

export abstract class Base {
    public static tableName: string = '';
    public static fillable: string[] = [];
    public static hidden: string[] = [];
    public static primaryKey: string = 'id';
    public static casts: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array'> = {};

    [key: string]: any;

    constructor(attributes: Record<string, any> = {}) {
        this.fill(attributes);
    }

    protected castValue(value: any, castType: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array'): any {
        if (value === null || value === undefined) {
            return null;
        }

        switch (castType) {
            case 'string':
                return String(value);
            case 'number':
                const num = Number(value);
                return isNaN(num) ? null : num;
            case 'boolean':
                if (typeof value === 'string') {
                    return value.toLowerCase() === 'true' || value === '1';
                }
                return Boolean(value);
            case 'date':
                const date = new Date(value);
                return isNaN(date.getTime()) ? null : date;
            case 'json':
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return null;
                    }
                }
                return value;
            case 'array':
                if (typeof value === 'string') {
                    try {
                        const parsed = JSON.parse(value);
                        return Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        return [value];
                    }
                }
                return Array.isArray(value) ? value : [value];
            default:
                return value;
        }
    }

    protected serializeValue(value: any, castType: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array'): any {
        if (value === null || value === undefined) {
            return null;
        }

        switch (castType) {
            case 'string':
                return String(value);
            case 'number':
                return Number(value);
            case 'boolean':
                return value ? 1 : 0;
            case 'date':
                if (value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            case 'json':
            case 'array':
                return JSON.stringify(value);
            default:
                return value;
        }
    }

    public fill(attributes: Record<string, any>): this {
        const TargetClass = this.constructor as typeof Base;
        const fillable = TargetClass.fillable || [];
        const primaryKey = TargetClass.primaryKey || 'id';
        const allowedKeys = new Set<string>([...fillable, primaryKey]);

        if (fillable.includes('createdAt')) allowedKeys.add('createdAt');
        if (fillable.includes('updatedAt')) allowedKeys.add('updatedAt');
        if (fillable.includes('deletedAt')) allowedKeys.add('deletedAt');

        for (const key of Object.keys(attributes)) {
            if (allowedKeys.has(key)) {
                if (attributes[key] !== undefined) {
                    const casts = (this.constructor as typeof Base).casts || {};
                    if (casts[key]) {
                        this[key] = this.castValue(attributes[key], casts[key]);
                    } else {
                        this[key] = attributes[key];
                    }
                }
            }
        }
        return this;
    }

    public toFillableArray(): Record<string, any> {
        const TargetClass = this.constructor as typeof Base;
        const fillable = TargetClass.fillable || [];
        const primaryKey = TargetClass.primaryKey || 'id';
        const casts = TargetClass.casts || {};
        const obj: Record<string, any> = {};

        const allowedKeys = new Set<string>([...fillable, primaryKey]);

        if (fillable.includes('createdAt')) allowedKeys.add('createdAt');
        if (fillable.includes('updatedAt')) allowedKeys.add('updatedAt');
        if (fillable.includes('deletedAt')) allowedKeys.add('deletedAt');

        for (const key of allowedKeys) {
            if (this[key] !== undefined) {
                if (casts[key]) {
                    obj[key] = this.serializeValue(this[key], casts[key]);
                } else {
                    obj[key] = this[key];
                }
            }
        }

        return obj;
    }

    public toJSON(): Record<string, any> {
        const TargetClass = this.constructor as typeof Base;
        const hiddenFields = TargetClass.hidden || [];
        const casts = TargetClass.casts || {};
        const fillable = TargetClass.fillable || [];
        const data: Record<string, any> = {};

        const allKeys = new Set<string>([
            ...Object.keys(this),
            ...fillable,
            TargetClass.primaryKey,
        ]);

        if (fillable.includes('createdAt')) allKeys.add('createdAt');
        if (fillable.includes('updatedAt')) allKeys.add('updatedAt');
        if (fillable.includes('deletedAt')) allKeys.add('deletedAt');

        for (const key of allKeys) {
            if (hiddenFields.includes(key)) continue;

            let value = this[key] ?? null;

            if (value !== null && casts[key]) {
                value = this.castValue(value, casts[key]);
            }

            data[key] = value;
        }

        return data;
    }

    public static query<T extends Base>(this: ModelConstructor<T>): Builder<Record<string, any>> {
        return new Builder<Record<string, any>>(this.tableName, this);
    }

    public static select<T extends Base>(this: ModelConstructor<T>, ...columns: string[]): Builder<Record<string, any>> {
        return this.query().select(...columns);
    }

    public static selectRaw<T extends Base>(this: ModelConstructor<T>, sql: string, bindings: any[] = []): Builder<Record<string, any>> {
        return this.query().selectRaw(sql, bindings);
    }

    public static where<T extends Base>(
        this: ModelConstructor<T>,
        callback: (builder: Builder<Record<string, any>>) => void
    ): Builder<Record<string, any>>;

    public static where<T extends Base>(
        this: ModelConstructor<T>,
        column: string,
        value: any
    ): Builder<Record<string, any>>;

    public static where<T extends Base>(
        this: ModelConstructor<T>,
        column: string,
        operator: string,
        value: any
    ): Builder<Record<string, any>>;

    public static where<T extends Base>(
        this: ModelConstructor<T>,
        columnOrCallback: string | ((builder: Builder<Record<string, any>>) => void),
        operatorOrValue?: any,
        value?: any
    ): Builder<Record<string, any>> {
        const query = this.query();

        if (typeof columnOrCallback === 'function') {
            return (query as any).where(columnOrCallback);
        }

        if (value === undefined) {
            return (query as any).where(columnOrCallback, '=', operatorOrValue);
        }

        return (query as any).where(columnOrCallback, operatorOrValue, value);
    }

    public static whereOr<T extends Base>(this: ModelConstructor<T>, column: string, operator: any, value?: any): Builder<Record<string, any>> {
        return this.query().whereOr(column, operator, value);
    }

    public static orWhere<T extends Base>(
        this: ModelConstructor<T>,
        callback: (builder: Builder<Record<string, any>>) => void
    ): Builder<Record<string, any>>;

    public static orWhere<T extends Base>(
        this: ModelConstructor<T>,
        column: string,
        value: any
    ): Builder<Record<string, any>>;

    public static orWhere<T extends Base>(
        this: ModelConstructor<T>,
        column: string,
        operator: string,
        value: any
    ): Builder<Record<string, any>>;

    public static orWhere<T extends Base>(
        this: ModelConstructor<T>,
        columnOrCallback: string | ((builder: Builder<Record<string, any>>) => void),
        operatorOrValue?: any,
        value?: any
    ): Builder<Record<string, any>> {
        const query = this.query();

        if (typeof columnOrCallback === 'function') {
            return (query as any).orWhere(columnOrCallback);
        }

        if (value === undefined) {
            return (query as any).orWhere(columnOrCallback, '=', operatorOrValue);
        }

        return (query as any).orWhere(columnOrCallback, operatorOrValue, value);
    }

    public static whereIn<T extends Base>(this: ModelConstructor<T>, column: string, values: any[]): Builder<Record<string, any>> {
        return this.query().whereIn(column, values);
    }

    public static whereNotIn<T extends Base>(this: ModelConstructor<T>, column: string, values: any[]): Builder<Record<string, any>> {
        return this.query().whereNotIn(column, values);
    }

    public static whereNull<T extends Base>(this: ModelConstructor<T>, column: string): Builder<Record<string, any>> {
        return this.query().whereNull(column);
    }

    public static whereNotNull<T extends Base>(this: ModelConstructor<T>, column: string): Builder<Record<string, any>> {
        return this.query().whereNotNull(column);
    }

    public static whereBetween<T extends Base>(this: ModelConstructor<T>, column: string, range: [any, any]): Builder<Record<string, any>> {
        return this.query().whereBetween(column, range);
    }

    public static whereNotBetween<T extends Base>(this: ModelConstructor<T>, column: string, range: [any, any]): Builder<Record<string, any>> {
        return this.query().whereNotBetween(column, range);
    }

    public static whereColumn<T extends Base>(this: ModelConstructor<T>, first: string, operator: string, second: string): Builder<Record<string, any>> {
        return this.query().whereColumn(first, operator, second);
    }

    public static whereRaw<T extends Base>(this: ModelConstructor<T>, sql: string, bindings: any[] = []): Builder<Record<string, any>> {
        return this.query().whereRaw(sql, bindings);
    }

    public static orderBy<T extends Base>(this: ModelConstructor<T>, column: string, direction: 'ASC' | 'DESC' = 'ASC'): Builder<Record<string, any>> {
        return this.query().orderBy(column, direction);
    }

    public static orderByDesc<T extends Base>(this: ModelConstructor<T>, column: string): Builder<Record<string, any>> {
        return this.query().orderByDesc(column);
    }

    public static inRandomOrder<T extends Base>(this: ModelConstructor<T>): Builder<Record<string, any>> {
        return this.query().inRandomOrder();
    }

    public static limit<T extends Base>(this: ModelConstructor<T>, limit: number): Builder<Record<string, any>> {
        return this.query().limit(limit);
    }

    public static take<T extends Base>(this: ModelConstructor<T>, limit: number): Builder<Record<string, any>> {
        return this.query().take(limit);
    }

    public static offset<T extends Base>(this: ModelConstructor<T>, offset: number): Builder<Record<string, any>> {
        return this.query().offset(offset);
    }

    public static skip<T extends Base>(this: ModelConstructor<T>, offset: number): Builder<Record<string, any>> {
        return this.query().skip(offset);
    }

    public static groupBy<T extends Base>(this: ModelConstructor<T>, ...columns: string[]): Builder<Record<string, any>> {
        return this.query().groupBy(...columns);
    }

    public static join<T extends Base>(this: ModelConstructor<T>, table: string, first: string, operator: string, second: string): Builder<Record<string, any>> {
        return this.query().join(table, first, operator, second);
    }

    public static leftJoin<T extends Base>(this: ModelConstructor<T>, table: string, first: string, operator: string, second: string): Builder<Record<string, any>> {
        return this.query().leftJoin(table, first, operator, second);
    }

    public static rightJoin<T extends Base>(this: ModelConstructor<T>, table: string, first: string, operator: string, second: string): Builder<Record<string, any>> {
        return this.query().rightJoin(table, first, operator, second);
    }

    public static withTrashed<T extends Base>(this: ModelConstructor<T>): Builder<Record<string, any>> {
        return this.query().withTrashed();
    }

    public static lockForUpdate<T extends Base>(this: ModelConstructor<T>): Builder<Record<string, any>> {
        return this.query().lockForUpdate();
    }

    public static sharedLock<T extends Base>(this: ModelConstructor<T>): Builder<Record<string, any>> {
        return this.query().sharedLock();
    }

    public static async all<T extends Base>(this: ModelConstructor<T>, txClient?: PoolConnection): Promise<T[]> {
        return this.query().get(txClient) as Promise<T[]>;
    }

    public static async find<T extends Base>(this: ModelConstructor<T>, id: string | number, txClient?: PoolConnection): Promise<T | null> {
        return this.query().find(id, txClient) as Promise<T | null>;
    }

    public static async findOrFail<T extends Base>(this: ModelConstructor<T>, id: string | number, txClient?: PoolConnection): Promise<T> {
        return this.query().findOrFail(id, txClient) as Promise<T>;
    }

    public static async first<T extends Base>(this: ModelConstructor<T>, txClient?: PoolConnection): Promise<T | null> {
        return this.query().first(txClient) as Promise<T | null>;
    }

    public static async create<T extends Base>(this: ModelConstructor<T>, data: Record<string, any>, txClient?: PoolConnection): Promise<T> {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data provided for create');
        }

        const cleanData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                cleanData[key] = value;
            }
        }

        const instance = new this(cleanData);
        await instance.save(txClient);
        return instance;
    }

    public static async count<T extends Base>(this: ModelConstructor<T>, txClient?: PoolConnection): Promise<number> {
        return this.query().count(txClient);
    }

    public static async exists<T extends Base>(this: ModelConstructor<T>, txClient?: PoolConnection): Promise<boolean> {
        return this.query().exists(txClient);
    }

    public static async paginate<T extends Base>(this: ModelConstructor<T>, page: number = 1, perPage: number = 15, txClient?: PoolConnection) {
        const result = await this.query().paginate(page, perPage, txClient);
        return {
            ...result,
            data: result.data.map((row: any) => row instanceof this ? row : new this(row))
        };
    }

    public static async chunk<T extends Base>(this: ModelConstructor<T>, size: number, callback: (records: T[]) => Promise<void>, txClient?: PoolConnection): Promise<void> {
        return this.query().chunk(size, async (records: any[]) => {
            await callback(records.map((r: any) => r instanceof this ? r : new this(r)));
        }, txClient);
    }

    public static async chunkById<T extends Base>(this: ModelConstructor<T>, size: number, callback: (records: T[]) => Promise<void>, txClient?: PoolConnection): Promise<void> {
        return this.query().chunkById(size, async (records: any[]) => {
            await callback(records.map((r: any) => r instanceof this ? r : new this(r)));
        }, txClient);
    }

    public static async pluck<T extends Base>(this: ModelConstructor<T>, column: string, txClient?: PoolConnection): Promise<any[]> {
        return this.query().pluck(column, txClient);
    }

    public static async value<T extends Base>(this: ModelConstructor<T>, column: string, txClient?: PoolConnection): Promise<any> {
        return this.query().value(column, txClient);
    }

    public async save(txClient?: PoolConnection): Promise<this> {
        const ctor = this.constructor as unknown as ModelConstructor<this>;
        const now = new Date();
        const payload = this.toFillableArray();

        const fillable = ctor.fillable || [];
        const hasCreatedAt = fillable.includes('createdAt');
        const hasUpdatedAt = fillable.includes('updatedAt');

        if (this[ctor.primaryKey]) {
            if (hasUpdatedAt) {
                payload.updatedAt = now;
            }
            await ctor.query().where(ctor.primaryKey, this[ctor.primaryKey]).update(payload, txClient);
            if (hasUpdatedAt) {
                this.updatedAt = now;
            }
        } else {
            if (hasCreatedAt) {
                payload.createdAt = now;
            }
            if (hasUpdatedAt) {
                payload.updatedAt = now;
            }
            const inserted = await ctor.query().insert(payload, txClient);
            if (inserted) {
                Object.assign(this, inserted);
            }
        }

        return this;
    }

    public static async update<T extends Base>(
        this: ModelConstructor<T>,
        conditions: Record<string, any> | string | number,
        data: Record<string, any>,
        txClient?: PoolConnection
    ): Promise<boolean> {
        let query = this.query();

        if (typeof conditions === 'string' || typeof conditions === 'number') {
            query = query.where(this.primaryKey, conditions);
        } else if (typeof conditions === 'object') {
            for (const [key, value] of Object.entries(conditions)) {
                query = query.where(key, value);
            }
        }

        const fillable = this.fillable || [];
        const updateData = { ...data };
        if (fillable.includes('updatedAt')) {
            updateData.updatedAt = new Date();
        }

        const result = await query.update(updateData, txClient);

        if (Array.isArray(result)) {
            return result.length > 0;
        }
        return result > 0;
    }

    public async delete(txClient?: PoolConnection): Promise<boolean> {
        const ctor = this.constructor as unknown as ModelConstructor<this>;
        if (!this[ctor.primaryKey]) {
            throw new Error("Cannot delete model without primary key.");
        }
        return ctor.query().where(ctor.primaryKey, this[ctor.primaryKey]).delete(txClient);
    }

    public async softDelete(txClient?: PoolConnection): Promise<this> {
        const ctor = this.constructor as unknown as ModelConstructor<this>;
        if (!this[ctor.primaryKey]) {
            throw new Error("Cannot soft delete model without primary key.");
        }
        const now = new Date();
        await ctor.query().where(ctor.primaryKey, this[ctor.primaryKey]).update({ deletedAt: now }, txClient);
        this.deletedAt = now;
        return this;
    }

    public async restore(txClient?: PoolConnection): Promise<this> {
        const ctor = this.constructor as unknown as ModelConstructor<this>;
        if (!this[ctor.primaryKey]) {
            throw new Error("Cannot restore model without primary key.");
        }
        await ctor.query().withTrashed().where(ctor.primaryKey, this[ctor.primaryKey]).update({ deletedAt: null }, txClient);
        this.deletedAt = null;
        return this;
    }

    public async increment(column: string, amount: number = 1, txClient?: PoolConnection): Promise<void> {
        const ctor = this.constructor as unknown as ModelConstructor<this>;
        if (!this[ctor.primaryKey]) throw new Error("Model ID is required.");
        await ctor.query().where(ctor.primaryKey, this[ctor.primaryKey]).increment(column, amount, txClient);
        if (typeof this[column] === 'number') {
            this[column] += amount;
        }
    }

    public async decrement(column: string, amount: number = 1, txClient?: PoolConnection): Promise<void> {
        const ctor = this.constructor as unknown as ModelConstructor<this>;
        if (!this[ctor.primaryKey]) throw new Error("Model ID is required.");
        await ctor.query().where(ctor.primaryKey, this[ctor.primaryKey]).decrement(column, amount, txClient);
        if (typeof this[column] === 'number') {
            this[column] -= amount;
        }
    }
}