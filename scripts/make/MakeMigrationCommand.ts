import fs from 'fs';
import path from 'path';
import { Command } from '../types';

export class MakeMigrationCommand implements Command {
    public name = 'make:migration';
    public description = 'Create a new migration file';

    public async execute(args: string[]): Promise<void> {
        const migrationName = args[0];

        if (!migrationName) {
            const errorBadge = '\x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m';
            console.error(`\n ${errorBadge} Migration name is required.`);
            console.log(' Usage: npm run make:migration <migration_name>\n');
            process.exit(1);
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}_${month}_${day}_${hours}${minutes}${seconds}`;

        const fileName = `${timestamp}_${migrationName}.ts`;
        const relativeDirPath = path.join('database', 'migrations');
        const migrationsDir = path.join(process.cwd(), relativeDirPath);

        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir, { recursive: true });
        }

        const filePath = path.join(migrationsDir, fileName);
        const className = migrationName
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join('');

        const isCreate = migrationName.startsWith('create_');
        const match = migrationName.match(/^create_(.+)_table$/i);
        const tableName = match ? match[1] : 'table_name';

        const content = isCreate
            ? `import { Schema } from '@/core/database/Schema';
import { Blueprint } from '@/core/database/Blueprint';

export default class ${className} {
    public async up(): Promise<void> {
        await Schema.create('${tableName}', (table: Blueprint) => {
            table.id();
            table.timestamps();
        });
    }

    public async down(): Promise<void> {
        await Schema.dropIfExists('${tableName}');
    }
}
`
            : `import { Schema } from '@/core/database/Schema';
import { Blueprint } from '@/core/database/Blueprint';

export default class ${className} {
    public async up(): Promise<void> {
        await Schema.table('${tableName}', (table: Blueprint) => {
            //
        });
    }

    public async down(): Promise<void> {
        await Schema.table('${tableName}', (table: Blueprint) => {
            //
        });
    }
}
`;

        fs.writeFileSync(filePath, content, 'utf8');

        const infoBadge = '\x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m';
        const absolutePath = path.resolve(filePath);

        console.log(`\n ${infoBadge} Migration [${absolutePath}] created successfully.\n`);
    }
}