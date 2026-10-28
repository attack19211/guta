import db from '@/config/database';
import { Command } from '../types';
import { Migrator } from './Migrator';

export class MigrateCommand implements Command {
    public name = 'migrate';
    public description = 'Run the database migrations';

    public async execute(): Promise<void> {
        await Migrator.ensureDatabaseExists();

        const hasTable = await Migrator.hasMigrationsTable();

        if (!hasTable) {
            Migrator.printInfo('Preparing database.');
            const startTime = Date.now();
            await Migrator.ensureMigrationsTable();
            const duration = Date.now() - startTime;
            Migrator.printTaskLine('Creating migration table', duration);
        }

        const files = Migrator.getMigrationFiles();
        const ranMigrations = await Migrator.getRanMigrations();
        const ranNames = new Set(ranMigrations.map(m => m.migration));

        const pendingFiles = files.filter(file => !ranNames.has(file.replace(/\.(ts|js)$/, '')));

        if (pendingFiles.length === 0) {
            Migrator.printInfo('Nothing to migrate.');
            return;
        }

        Migrator.printInfo('Running migrations.');
        const batch = await Migrator.getNextBatchNumber();

        for (const file of pendingFiles) {
            const migrationName = file.replace(/\.(ts|js)$/, '');
            const startTime = Date.now();

            const instance = await Migrator.loadMigrationClass(file);

            try {
                await instance.up();

                await db.execute(
                    'INSERT INTO `migrations` (`migration`, `batch`) VALUES (?, ?)',
                    [migrationName, batch]
                );

                const duration = Date.now() - startTime;
                Migrator.printTaskLine(migrationName, duration);
            } catch (error: any) {
                console.error(`\nMigration failed: ${migrationName}`);
                
                try {
                    if (typeof instance.down === 'function') {
                        await instance.down();
                    }
                } catch (rollbackError) {
                    console.error(`Failed to rollback:`, rollbackError);
                }
                
                throw error;
            }
        }

        console.log('');
    }
}