import { Command } from '../types';
import { Migrator } from './Migrator';

export class MigrateStatusCommand implements Command {
    public name = 'migrate:status';
    public description = 'Show the status of each migration';

    public async execute(): Promise<void> {
        await Migrator.ensureDatabaseExists();
        await Migrator.ensureMigrationsTable();

        const files = Migrator.getMigrationFiles();
        const ranMigrations = await Migrator.getRanMigrations();
        const ranMap = new Map(ranMigrations.map(m => [m.migration, m.batch]));

        console.log('');
        Migrator.printStatusLine('Migration name', 'Batch / Status');

        for (const file of files) {
            const migrationName = file.replace(/\.(ts|js)$/, '');
            const isRan = ranMap.has(migrationName);
            const statusText = isRan ? `[${ranMap.get(migrationName)}] Ran` : 'Pending';

            Migrator.printStatusLine(migrationName, statusText);
        }

        console.log('');
    }
}