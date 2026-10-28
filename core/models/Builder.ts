// core/models/Builder.ts

import db from '@/config/database';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export class Builder<T = any> {
    private tableName: string;
    private modelCtor?: any;
    private conditions: { column: string; operator: string; value: any; boolean: 'AND' | 'OR' }[] = [];
    private columns: string[] = ['*'];
    private limitValue: number | null = null;
    private offsetValue: number | null = null;
    private orderBys: { column: string; direction: 'ASC' | 'DESC' }[] = [];
    private joins: { type: string; table: string; first: string; operator: string; second: string }[] = [];
    private withTrashedFlag: boolean = false;
    private groupByColumns: string[] = [];
    private havingConditions: { column: string; operator: string; value: any }[] = [];
    private lockForUpdateFlag: boolean = false;
    private sharedLockFlag: boolean = false;
    private rawSelect: { sql: string; bindings: any[] } | null = null;
    private static tableColumnsCache: Map<string, Set<string>> = new Map();

    constructor(tableName: string, modelCtor?: any) {
        this.tableName = tableName;
        this.modelCtor = modelCtor;
    }

    private quoteColumn(column: string): string {
        if (column.includes('.') || column.includes('`') || column.includes('"') || column.includes('(') || column === '*') {
            return column;
        }
        return `\`${column}\``;
    }

    private mapToModel(row: any): any {
        if (!row) return null;
        if (this.modelCtor && !(row instanceof this.modelCtor)) {
            return new this.modelCtor(row);
        }
        return row;
    }

    private async hasDeletedAtColumn(): Promise<boolean> {
        if (Builder.tableColumnsCache.has(this.tableName)) {
            const columns = Builder.tableColumnsCache.get(this.tableName)!;
            return columns.has('deletedAt');
        }

        try {
            const [rows] = await db.query<any[]>(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = ?`,
                [this.tableName]
            );

            const columns = new Set<string>();
            if (rows && rows.length > 0) {
                rows.forEach(row => {
                    if (row.COLUMN_NAME) {
                        columns.add(row.COLUMN_NAME);
                    }
                });
            }

            Builder.tableColumnsCache.set(this.tableName, columns);
            return columns.has('deletedAt');
        } catch (error) {
            return false;
        }
    }

    public select(...columns: string[]): this {
        this.columns = columns.map(c => this.quoteColumn(c));
        return this;
    }

    public selectRaw(sql: string, bindings: any[] = []): this {
        this.rawSelect = { sql, bindings };
        this.columns = [];
        return this;
    }

    public where(column: string, operator: any, value?: any): this {
        if (value === undefined) {
            value = operator;
            operator = '=';
        }

        if (typeof value === 'boolean') {
            value = value ? 1 : 0;
        }

        this.conditions.push({ column, operator, value, boolean: 'AND' });
        return this;
    }

    public whereOr(column: string, operator: any, value?: any): this {
        if (value === undefined) {
            value = operator;
            operator = '=';
        }

        if (typeof value === 'boolean') {
            value = value ? 1 : 0;
        }

        this.conditions.push({ column, operator, value, boolean: 'OR' });
        return this;
    }

    public orWhere(column: string, operator: any, value?: any): this {
        return this.whereOr(column, operator, value);
    }

    public whereIn(column: string, values: any[]): this {
        this.conditions.push({ column, operator: 'IN', value: values, boolean: 'AND' });
        return this;
    }

    public whereNotIn(column: string, values: any[]): this {
        this.conditions.push({ column, operator: 'NOT IN', value: values, boolean: 'AND' });
        return this;
    }

    public whereNull(column: string): this {
        this.conditions.push({ column, operator: 'IS NULL', value: null, boolean: 'AND' });
        return this;
    }

    public whereNotNull(column: string): this {
        this.conditions.push({ column, operator: 'IS NOT NULL', value: null, boolean: 'AND' });
        return this;
    }

    public whereBetween(column: string, range: [any, any]): this {
        this.conditions.push({ column, operator: 'BETWEEN', value: range, boolean: 'AND' });
        return this;
    }

    public whereNotBetween(column: string, range: [any, any]): this {
        this.conditions.push({ column, operator: 'NOT BETWEEN', value: range, boolean: 'AND' });
        return this;
    }

    public whereColumn(first: string, operator: string, second: string): this {
        this.conditions.push({ column: `${this.quoteColumn(first)} ${operator} ${this.quoteColumn(second)}`, operator: 'RAW', value: null, boolean: 'AND' });
        return this;
    }

    public whereRaw(sql: string, bindings: any[] = []): this {
        this.conditions.push({ column: sql, operator: 'RAW_SQL', value: bindings, boolean: 'AND' });
        return this;
    }

    public orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
        this.orderBys.push({ column, direction });
        return this;
    }

    public orderByDesc(column: string): this {
        return this.orderBy(column, 'DESC');
    }

    public inRandomOrder(): this {
        this.orderBys.push({ column: 'RAND()', direction: 'ASC' });
        return this;
    }

    public limit(limit: number): this {
        this.limitValue = limit;
        return this;
    }

    public take(limit: number): this {
        return this.limit(limit);
    }

    public offset(offset: number): this {
        this.offsetValue = offset;
        return this;
    }

    public skip(offset: number): this {
        return this.offset(offset);
    }

    public groupBy(...columns: string[]): this {
        this.groupByColumns = columns;
        return this;
    }

    public having(column: string, operator: string, value: any): this {
        this.havingConditions.push({ column, operator, value });
        return this;
    }

    public join(table: string, first: string, operator: string, second: string): this {
        this.joins.push({ type: 'INNER JOIN', table, first, operator, second });
        return this;
    }

    public leftJoin(table: string, first: string, operator: string, second: string): this {
        this.joins.push({ type: 'LEFT JOIN', table, first, operator, second });
        return this;
    }

    public rightJoin(table: string, first: string, operator: string, second: string): this {
        this.joins.push({ type: 'RIGHT JOIN', table, first, operator, second });
        return this;
    }

    public withTrashed(): this {
        this.withTrashedFlag = true;
        return this;
    }

    public lockForUpdate(): this {
        this.lockForUpdateFlag = true;
        return this;
    }

    public sharedLock(): this {
        this.sharedLockFlag = true;
        return this;
    }

    private async buildQuery(): Promise<{ text: string; params: any[] }> {
        let selectClause = this.columns.join(', ');
        const params: any[] = [];

        if (this.rawSelect) {
            selectClause = this.rawSelect.sql;
            params.push(...this.rawSelect.bindings);
        }

        let query = `SELECT ${selectClause} FROM \`${this.tableName}\``;

        for (const join of this.joins) {
            query += ` ${join.type} \`${join.table}\` ON ${join.first} ${join.operator} ${join.second}`;
        }

        if (this.conditions.length > 0) {
            const whereClauses: string[] = [];
            for (const condition of this.conditions) {
                const boolean = whereClauses.length > 0 ? ` ${condition.boolean} ` : '';

                if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
                    const placeholders = condition.value.map(() => '?').join(', ');
                    whereClauses.push(`${boolean}${this.quoteColumn(condition.column)} ${condition.operator} (${placeholders})`);
                    params.push(...condition.value);
                } else if (condition.operator === 'BETWEEN' || condition.operator === 'NOT BETWEEN') {
                    whereClauses.push(`${boolean}${this.quoteColumn(condition.column)} ${condition.operator} ? AND ?`);
                    params.push(condition.value[0], condition.value[1]);
                } else if (condition.operator === 'RAW') {
                    whereClauses.push(`${boolean}${condition.column}`);
                } else if (condition.operator === 'RAW_SQL') {
                    whereClauses.push(`${boolean}${condition.column}`);
                    params.push(...condition.value);
                } else if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
                    whereClauses.push(`${boolean}${this.quoteColumn(condition.column)} ${condition.operator}`);
                } else {
                    whereClauses.push(`${boolean}${this.quoteColumn(condition.column)} ${condition.operator} ?`);
                    params.push(condition.value);
                }
            }
            query += ` WHERE ${whereClauses.join('')}`;
        }

        if (!this.withTrashedFlag) {
            const hasDeletedAt = await this.hasDeletedAtColumn();
            if (hasDeletedAt) {
                const softDeleteCondition = `\`${this.tableName}\`.\`deletedAt\` IS NULL`;
                if (query.includes(' WHERE ')) {
                    query += ` AND ${softDeleteCondition}`;
                } else {
                    query += ` WHERE ${softDeleteCondition}`;
                }
            }
        }

        if (this.groupByColumns.length > 0) {
            query += ` GROUP BY ${this.groupByColumns.map(c => this.quoteColumn(c)).join(', ')}`;
        }

        if (this.havingConditions.length > 0) {
            const havingClauses: string[] = [];
            for (const having of this.havingConditions) {
                havingClauses.push(`${this.quoteColumn(having.column)} ${having.operator} ?`);
                params.push(having.value);
            }
            query += ` HAVING ${havingClauses.join(' AND ')}`;
        }

        if (this.orderBys.length > 0) {
            query += ` ORDER BY ${this.orderBys.map(o => {
                if (o.column === 'RAND()' || o.column === 'RANDOM()') return 'RAND()';
                return `${this.quoteColumn(o.column)} ${o.direction}`;
            }).join(', ')}`;
        }

        if (this.limitValue !== null) {
            query += ` LIMIT ?`;
            params.push(this.limitValue);
        }

        if (this.offsetValue !== null) {
            query += ` OFFSET ?`;
            params.push(this.offsetValue);
        }

        if (this.lockForUpdateFlag) {
            query += ` FOR UPDATE`;
        } else if (this.sharedLockFlag) {
            query += ` FOR SHARE`;
        }

        return { text: query, params };
    }

    private async executeQuery<R = any>(sql: string, params: any[] = [], txClient?: PoolConnection): Promise<R[]> {
        if (txClient) {
            const [rows] = await txClient.query<(RowDataPacket & R)[]>(sql, params);
            return rows as R[];
        }
        const rows = await db.query<R>(sql, params);
        return rows as R[];
    }

    public async getRaw(sql: string, params: any[] = [], txClient?: PoolConnection): Promise<any[]> {
        return this.executeQuery(sql, params, txClient);
    }

    public async insert(data: Record<string, any>, txClient?: PoolConnection): Promise<T> {
        const cleanData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                cleanData[key] = value;
            }
        }

        if (Object.keys(cleanData).length === 0) {
            throw new Error(`No data to insert into ${this.tableName}`);
        }

        const keys = Object.keys(cleanData);
        const fields = keys.map(k => this.quoteColumn(k)).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const params = keys.map(k => cleanData[k]);

        const sql = `INSERT INTO \`${this.tableName}\` (${fields}) VALUES (${placeholders})`;

        let insertId: any;
        if (txClient) {
            const [result] = await txClient.execute<ResultSetHeader>(sql, params);
            insertId = result.insertId;
        } else {
            const result = (await db.execute(sql, params)) as unknown as ResultSetHeader;
            insertId = result?.insertId;
        }

        if (insertId) {
            const insertedRecord = await new Builder<T>(this.tableName, this.modelCtor).where('id', insertId).first(txClient);
            if (insertedRecord) {
                return insertedRecord;
            }
        }

        return this.mapToModel(cleanData) as T;
    }

    public async update(data: Record<string, any>, txClient?: PoolConnection): Promise<T[]> {
        if (this.conditions.length === 0) {
            throw new Error("Dangerous update without WHERE clause block.");
        }

        const cleanData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                cleanData[key] = value;
            }
        }

        const keys = Object.keys(cleanData);
        const fields: string[] = [];
        const params: any[] = [];

        for (const key of keys) {
            fields.push(`${this.quoteColumn(key)} = ?`);
            params.push(cleanData[key]);
        }

        let query = `UPDATE \`${this.tableName}\` SET ${fields.join(', ')}`;

        const whereClauses: string[] = [];
        for (const condition of this.conditions) {
            const boolean = whereClauses.length > 0 ? ` ${condition.boolean} ` : '';
            if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
                whereClauses.push(`${boolean}${this.quoteColumn(condition.column)} ${condition.operator}`);
            } else {
                whereClauses.push(`${boolean}${this.quoteColumn(condition.column)} ${condition.operator} ?`);
                params.push(condition.value);
            }
        }
        query += ` WHERE ${whereClauses.join('')}`;

        const hasDeletedAt = await this.hasDeletedAtColumn();
        if (!this.withTrashedFlag && hasDeletedAt) {
            query += ` AND \`deletedAt\` IS NULL`;
        }

        if (txClient) {
            await txClient.execute(query, params);
        } else {
            await db.execute(query, params);
        }

        return await this.get(txClient);
    }

    public async delete(txClient?: PoolConnection): Promise<boolean> {
        if (this.conditions.length === 0) {
            throw new Error("Dangerous delete without WHERE clause block.");
        }

        let query = `DELETE FROM \`${this.tableName}\``;
        const params: any[] = [];

        const whereClauses: string[] = [];
        for (const condition of this.conditions) {
            const boolean = whereClauses.length > 0 ? ` ${condition.boolean} ` : '';
            whereClauses.push(`${boolean}${this.quoteColumn(condition.column)} ${condition.operator} ?`);
            params.push(condition.value);
        }
        query += ` WHERE ${whereClauses.join('')}`;

        if (txClient) {
            await txClient.execute(query, params);
        } else {
            await db.execute(query, params);
        }
        return true;
    }

    public async get(txClient?: PoolConnection): Promise<T[]> {
        const { text, params } = await this.buildQuery();
        const rows = await this.executeQuery<T>(text, params, txClient);
        if (this.modelCtor) {
            return rows.map(row => this.mapToModel(row));
        }
        return rows;
    }

    public async first(txClient?: PoolConnection): Promise<T | null> {
        this.limit(1);
        const results = await this.get(txClient);
        return results[0] ?? null;
    }

    public async find(id: string | number, txClient?: PoolConnection): Promise<T | null> {
        return await this.where('id', id).first(txClient);
    }

    public async findOrFail(id: string | number, txClient?: PoolConnection): Promise<T> {
        const result = await this.find(id, txClient);
        if (!result) {
            throw new Error(`Record with id ${id} not found in ${this.tableName}`);
        }
        return result;
    }

    public async count(txClient?: PoolConnection): Promise<number> {
        const { text, params } = await this.buildQuery();
        const countQuery = text.replace(/SELECT .* FROM/i, 'SELECT COUNT(*) as count FROM');
        const rows = await this.executeQuery<any>(countQuery, params, txClient);
        return Number(rows[0]?.count) || 0;
    }

    public async min(column: string, txClient?: PoolConnection): Promise<number | null> {
        const { text, params } = await this.buildQuery();
        const minQuery = text.replace(/SELECT .* FROM/i, `SELECT MIN(${this.quoteColumn(column)}) as min FROM`);
        const rows = await this.executeQuery<any>(minQuery, params, txClient);
        const value = rows[0]?.min;
        return value !== null && value !== undefined ? Number(value) : null;
    }

    public async max(column: string, txClient?: PoolConnection): Promise<number | null> {
        const { text, params } = await this.buildQuery();
        const maxQuery = text.replace(/SELECT .* FROM/i, `SELECT MAX(${this.quoteColumn(column)}) as max FROM`);
        const rows = await this.executeQuery<any>(maxQuery, params, txClient);
        const value = rows[0]?.max;
        return value !== null && value !== undefined ? Number(value) : null;
    }

    public async sum(column: string, txClient?: PoolConnection): Promise<number> {
        const { text, params } = await this.buildQuery();
        const sumQuery = text.replace(/SELECT .* FROM/i, `SELECT COALESCE(SUM(${this.quoteColumn(column)}), 0) as sum FROM`);
        const rows = await this.executeQuery<any>(sumQuery, params, txClient);
        return Number(rows[0]?.sum) || 0;
    }

    public async avg(column: string, txClient?: PoolConnection): Promise<number | null> {
        const { text, params } = await this.buildQuery();
        const avgQuery = text.replace(/SELECT .* FROM/i, `SELECT AVG(${this.quoteColumn(column)}) as avg FROM`);
        const rows = await this.executeQuery<any>(avgQuery, params, txClient);
        const value = rows[0]?.avg;
        return value !== null && value !== undefined ? Number(value) : null;
    }

    public async increment(column: string, amount: number, txClient?: PoolConnection): Promise<void> {
        if (this.conditions.length === 0) {
            throw new Error("Dangerous increment without WHERE clause.");
        }

        const whereClauses: string[] = [];
        const params: any[] = [amount];

        for (const condition of this.conditions) {
            const boolean = whereClauses.length > 0 ? ` ${condition.boolean} ` : '';
            whereClauses.push(`${boolean}${this.quoteColumn(condition.column)} ${condition.operator} ?`);
            params.push(condition.value);
        }

        const sql = `UPDATE \`${this.tableName}\` SET ${this.quoteColumn(column)} = ${this.quoteColumn(column)} + ? WHERE ${whereClauses.join('')}`;

        const hasDeletedAt = await this.hasDeletedAtColumn();
        if (!this.withTrashedFlag && hasDeletedAt) {
            const whereClause = `\`deletedAt\` IS NULL`;
            if (sql.includes(' WHERE ')) {
                await txClient?.execute(sql + ` AND ${whereClause}`, params);
            } else {
                await txClient?.execute(sql + ` WHERE ${whereClause}`, params);
            }
        }

        if (txClient) {
            await txClient.execute(sql, params);
        } else {
            await db.execute(sql, params);
        }
    }

    public async decrement(column: string, amount: number, txClient?: PoolConnection): Promise<void> {
        if (this.conditions.length === 0) {
            throw new Error("Dangerous decrement without WHERE clause.");
        }

        const whereClauses: string[] = [];
        const params: any[] = [amount];

        for (const condition of this.conditions) {
            const boolean = whereClauses.length > 0 ? ` ${condition.boolean} ` : '';
            whereClauses.push(`${boolean}${this.quoteColumn(condition.column)} ${condition.operator} ?`);
            params.push(condition.value);
        }

        const sql = `UPDATE \`${this.tableName}\` SET ${this.quoteColumn(column)} = ${this.quoteColumn(column)} - ? WHERE ${whereClauses.join('')}`;

        if (txClient) {
            await txClient.execute(sql, params);
        } else {
            await db.execute(sql, params);
        }
    }

    public async exists(txClient?: PoolConnection): Promise<boolean> {
        const count = await this.count(txClient);
        return count > 0;
    }

    public async doesntExist(txClient?: PoolConnection): Promise<boolean> {
        return !(await this.exists(txClient));
    }

    public async paginate(page: number = 1, perPage: number = 15, txClient?: PoolConnection): Promise<{
        data: T[];
        currentPage: number;
        perPage: number;
        total: number;
        lastPage: number;
        from: number;
        to: number;
    }> {
        const total = await this.count(txClient);
        const lastPage = Math.ceil(total / perPage);
        const offset = (page - 1) * perPage;
        const data = await this.limit(perPage).offset(offset).get(txClient);
        return {
            data,
            currentPage: page,
            perPage,
            total,
            lastPage,
            from: offset + 1,
            to: Math.min(offset + perPage, total)
        };
    }

    public async chunk(size: number, callback: (records: T[]) => Promise<void>, txClient?: PoolConnection): Promise<void> {
        let offset = 0;
        let hasMore = true;
        while (hasMore) {
            const records = await this.limit(size).offset(offset).get(txClient);
            if (records.length === 0) {
                hasMore = false;
                break;
            }
            await callback(records);
            offset += size;
        }
    }

    public async chunkById(size: number, callback: (records: T[]) => Promise<void>, txClient?: PoolConnection): Promise<void> {
        let lastId = 0;
        let hasMore = true;
        while (hasMore) {
            const records = await this.where('id', '>', lastId).orderBy('id').limit(size).get(txClient);
            if (records.length === 0) {
                hasMore = false;
                break;
            }
            await callback(records);
            const lastRecord = records[records.length - 1] as any;
            lastId = lastRecord?.id || 0;
        }
    }

    public async each(callback: (record: T) => void, txClient?: PoolConnection): Promise<void> {
        const records = await this.get(txClient);
        for (const record of records) {
            callback(record);
        }
    }

    public async pluck(column: string, txClient?: PoolConnection): Promise<any[]> {
        const records = await this.select(column).get(txClient);
        return records.map(record => (record as any)[column]);
    }

    public async value(column: string, txClient?: PoolConnection): Promise<any> {
        const record = await this.first(txClient);
        return record ? (record as any)[column] : null;
    }

    public async toSql(): Promise<string> {
        const { text, params } = await this.buildQuery();
        let sql = text;
        params.forEach((param) => {
            const replacement = typeof param === 'string' ? `'${param.replace(/'/g, "\\'")}'` : String(param);
            sql = sql.replace('?', replacement);
        });
        return sql;
    }
}

export const DB = {
    transaction: async <T>(callback: (client: PoolConnection) => Promise<T>): Promise<T> => {
        const client = (await db.getClient()) as PoolConnection;

        try {
            await client.beginTransaction();
            const result = await callback(client);
            await client.commit();
            return result;
        } catch (error) {
            await client.rollback();
            throw error;
        } finally {
            client.release();
        }
    }
};