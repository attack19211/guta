// core/database/Blueprint.ts

export class ColumnDefinition {
    private current: string;
    private columnName: string;
    private blueprint: Blueprint;

    constructor(current: string, columnName: string, blueprint: Blueprint) {
        this.current = current;
        this.columnName = columnName;
        this.blueprint = blueprint;
    }

    nullable(): this {
        this.current = this.current.replace('NOT NULL', 'NULL');
        return this;
    }

    default(value: any): this {
        if (value === null) {
            this.current += ' DEFAULT NULL';
        } else if (typeof value === 'boolean') {
            this.current += ` DEFAULT ${value ? 1 : 0}`;
        } else if (typeof value === 'string') {
            const upper = value.trim().toUpperCase();
            const isRawExpression =
                upper === 'CURRENT_TIMESTAMP' ||
                upper === 'CURRENT_TIMESTAMP()' ||
                upper === 'NOW()' ||
                upper === 'UUID()' ||
                upper === 'NULL' ||
                upper.startsWith('CURRENT_TIMESTAMP(') ||
                /^[A-Z_]+\s*\(.*\)$/.test(upper);

            if (isRawExpression) {
                this.current += ` DEFAULT ${value}`;
            } else {
                this.current += ` DEFAULT '${value.replace(/'/g, "''")}'`;
            }
        } else {
            this.current += ` DEFAULT ${value}`;
        }
        return this;
    }

    unique(): this {
        this.current += ' UNIQUE';
        return this;
    }

    primary(): this {
        this.current += ' PRIMARY KEY';
        return this;
    }

    unsigned(): this {
        if (!this.current.includes('UNSIGNED')) {
            this.current = this.current.replace(/(`\w+`\s+[A-Z]+)/i, '$1 UNSIGNED');
        }
        return this;
    }

    comment(commentText: string): this {
        this.current += ` COMMENT '${commentText}'`;
        return this;
    }

    index(indexName?: string): this {
        this.blueprint.index(this.columnName, indexName);
        return this;
    }

    constrained(refTable?: string, refColumn: string = 'id'): {
        onDelete: (action?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION') => ColumnDefinition;
    } {
        const inferredTable = refTable || `${this.columnName.replace(/Id$/, '')}s`;

        return {
            onDelete: (action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' = 'NO ACTION'): ColumnDefinition => {
                this.blueprint.foreign(this.columnName)
                    .references(inferredTable)
                    .on(refColumn)
                    .onDelete(action);
                return this;
            }
        };
    }

    toString(): string {
        return this.current;
    }
}

export class Blueprint {
    private columns: (ColumnDefinition | { toString: () => string })[] = [];
    private indexes: string[] = [];
    private uniques: string[] = [];

    private addColumn(colSql: string, name: string): ColumnDefinition {
        const def = new ColumnDefinition(colSql, name, this);
        this.columns.push(def);
        return def;
    }

    id(name: string = 'id'): ColumnDefinition {
        return this.bigIncrements(name);
    }

    increments(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`, name);
    }

    tinyIncrements(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`, name);
    }

    smallIncrements(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`, name);
    }

    mediumIncrements(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`, name);
    }

    bigIncrements(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`, name);
    }

    integer(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` INT NOT NULL`, name);
    }

    tinyInteger(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` TINYINT NOT NULL`, name);
    }

    smallInteger(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` SMALLINT NOT NULL`, name);
    }

    mediumInteger(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` MEDIUMINT NOT NULL`, name);
    }

    bigInteger(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` BIGINT NOT NULL`, name);
    }

    unsignedInteger(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` INT UNSIGNED NOT NULL`, name);
    }

    unsignedTinyInteger(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` TINYINT UNSIGNED NOT NULL`, name);
    }

    unsignedSmallInteger(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` SMALLINT UNSIGNED NOT NULL`, name);
    }

    unsignedMediumInteger(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` MEDIUMINT UNSIGNED NOT NULL`, name);
    }

    unsignedBigInteger(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` BIGINT UNSIGNED NOT NULL`, name);
    }

    decimal(name: string, total: number = 28, places: number = 8): ColumnDefinition {
        return this.addColumn(`\`${name}\` DECIMAL(${total}, ${places}) NOT NULL`, name);
    }

    float(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` FLOAT NOT NULL`, name);
    }

    double(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` DOUBLE NOT NULL`, name);
    }

    char(name: string, length: number = 255): ColumnDefinition {
        return this.addColumn(`\`${name}\` CHAR(${length}) NOT NULL`, name);
    }

    string(name: string, length: number = 255): ColumnDefinition {
        return this.addColumn(`\`${name}\` VARCHAR(${length}) NOT NULL`, name);
    }

    tinyText(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` TINYTEXT NOT NULL`, name);
    }

    text(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` TEXT NOT NULL`, name);
    }

    mediumText(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` MEDIUMTEXT NOT NULL`, name);
    }

    longText(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` LONGTEXT NOT NULL`, name);
    }

    boolean(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` TINYINT(1) NOT NULL`, name);
    }

    date(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` DATE NOT NULL`, name);
    }

    dateTime(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` DATETIME NOT NULL`, name);
    }

    dateTimeTz(name: string): ColumnDefinition {
        return this.dateTime(name);
    }

    time(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` TIME NOT NULL`, name);
    }

    timeTz(name: string): ColumnDefinition {
        return this.time(name);
    }

    timestamp(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` TIMESTAMP NULL`, name);
    }

    timestampTz(name: string): ColumnDefinition {
        return this.timestamp(name);
    }

    timestamps(): void {
        this.addColumn(`\`createdAt\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`, 'createdAt');
        this.addColumn(`\`updatedAt\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`, 'updatedAt');
    }

    timestampsTz(): void {
        this.timestamps();
    }

    softDeletes(column: string = 'deletedAt'): ColumnDefinition {
        return this.addColumn(`\`${column}\` TIMESTAMP NULL`, column);
    }

    softDeletesTz(column: string = 'deletedAt'): ColumnDefinition {
        return this.softDeletes(column);
    }

    year(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` YEAR NOT NULL`, name);
    }

    json(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` JSON NULL`, name);
    }

    jsonb(name: string): ColumnDefinition {
        return this.json(name);
    }

    binary(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` LONGBLOB NOT NULL`, name);
    }

    enum(name: string, allowedValues: string[]): ColumnDefinition {
        const formattedValues = allowedValues.map(v => `'${v}'`).join(', ');
        return this.addColumn(`\`${name}\` ENUM(${formattedValues}) NOT NULL`, name);
    }

    set(name: string, allowedValues: string[]): ColumnDefinition {
        const formattedValues = allowedValues.map(v => `'${v}'`).join(', ');
        return this.addColumn(`\`${name}\` SET(${formattedValues}) NOT NULL`, name);
    }

    ipAddress(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` VARCHAR(45) NOT NULL`, name);
    }

    macAddress(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` VARCHAR(17) NOT NULL`, name);
    }

    rememberToken(): ColumnDefinition {
        return this.string('rememberToken', 100).nullable();
    }

    vector(name: string): ColumnDefinition {
        return this.json(name);
    }

    uuid(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` CHAR(36) NOT NULL`, name);
    }

    ulid(name: string): ColumnDefinition {
        return this.char(name, 26);
    }

    uuidMorphs(name: string): void {
        this.string(`${name}Type`);
        this.uuid(`${name}Id`);
        this.index([`${name}Type`, `${name}Id`]);
    }

    nullableUuidMorphs(name: string): void {
        this.string(`${name}Type`).nullable();
        this.uuid(`${name}Id`).nullable();
        this.index([`${name}Type`, `${name}Id`]);
    }

    ulidMorphs(name: string): void {
        this.string(`${name}Type`);
        this.ulid(`${name}Id`);
        this.index([`${name}Type`, `${name}Id`]);
    }

    nullableUlidMorphs(name: string): void {
        this.string(`${name}Type`).nullable();
        this.ulid(`${name}Id`).nullable();
        this.index([`${name}Type`, `${name}Id`]);
    }

    geometry(name: string): ColumnDefinition {
        return this.addColumn(`\`${name}\` GEOMETRY NOT NULL`, name);
    }

    geography(name: string): ColumnDefinition {
        return this.geometry(name);
    }

    foreignId(name: string): ColumnDefinition {
        return this.unsignedBigInteger(name);
    }

    foreignUuid(name: string): ColumnDefinition {
        return this.uuid(name);
    }

    foreignUlid(name: string): ColumnDefinition {
        return this.ulid(name);
    }

    foreignIdFor(modelName: string, name?: string): ColumnDefinition {
        const colName = name || `${modelName.toLowerCase()}Id`;
        return this.foreignId(colName);
    }

    foreignUuidFor(modelName: string, name?: string): ColumnDefinition {
        const colName = name || `${modelName.toLowerCase()}Id`;
        return this.foreignUuid(colName);
    }

    morphs(name: string): void {
        this.string(`${name}Type`);
        this.unsignedBigInteger(`${name}Id`);
        this.index([`${name}Type`, `${name}Id`]);
    }

    nullableMorphs(name: string): void {
        this.string(`${name}Type`).nullable();
        this.unsignedBigInteger(`${name}Id`).nullable();
        this.index([`${name}Type`, `${name}Id`]);
    }

    foreign(column: string) {
        return {
            references: (refTable: string) => ({
                on: (refColumn: string) => ({
                    onDelete: (action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' = 'NO ACTION') => {
                        this.columns.push({
                            toString: () => `FOREIGN KEY (\`${column}\`) REFERENCES \`${refTable}\`(\`${refColumn}\`) ON DELETE ${action.toUpperCase()}`
                        });
                    }
                })
            })
        };
    }

    index(columns: string | string[], indexName?: string): void {
        const cols = Array.isArray(columns) ? columns : [columns];
        const cleanTableName = '__TABLE__';
        const name = indexName || `idx_${cleanTableName}_${cols.join('_')}`;
        const formattedCols = cols.map(c => `\`${c}\``).join(', ');

        this.indexes.push(`CREATE INDEX \`${name}\` ON \`${cleanTableName}\` (${formattedCols});`);
    }

    unique(columns: string | string[], indexName?: string): void {
        const cols = Array.isArray(columns) ? columns : [columns];
        const cleanTableName = '__TABLE__';
        const name = indexName || `uniq_${cleanTableName}_${cols.join('_')}`;
        const formattedCols = cols.map(c => `\`${c}\``).join(', ');

        this.uniques.push(`UNIQUE KEY \`${name}\` (${formattedCols})`);
    }

    toSQL(tableName: string): string {
        const sqlColumns = this.columns
            .map(c => c.toString().replace(/__TABLE__/g, tableName));

        const sqlUniques = this.uniques
            .map(u => u.replace(/__TABLE__/g, tableName));

        const allTableDefinitions = [...sqlColumns, ...sqlUniques].join(',\n  ');

        const createTableSql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n  ${allTableDefinitions}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

        const indexSql = this.indexes
            .map(idx => idx.replace(/__TABLE__/g, tableName))
            .join('\n');

        return indexSql ? `${createTableSql}\n${indexSql}` : createTableSql;
    }
}