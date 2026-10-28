import db from '@/config/database';
import { Command } from '../types';
import { Migrator } from './Migrator';

export class MigrateResetCommand implements Command {
    public name = 'migrate:reset';
    public description = 'Rollback all database migrations';

    public async execute(): Promise<void> {
        await Migrator.ensureDatabaseExists();
        await Migrator.ensureMigrationsTable();

        const ranMigrations = await Migrator.getRanMigrations();

        if (ranMigrations.length === 0) {
            Migrator.printInfo('Nothing to reset.');
            return;
        }

        Migrator.printInfo('Rolling back migrations.');

        const files = Migrator.getMigrationFiles();
        const reversed = [...ranMigrations].sort((a, b) => b.id - a.id);

        for (const record of reversed) {
            const startTime = Date.now();
            const matchingFile = files.find(f => f.startsWith(record.migration));

            if (matchingFile) {
                const instance = await Migrator.loadMigrationClass(matchingFile);
                await instance.down();
            }

            await db.execute('DELETE FROM `migrations` WHERE `id` = ?', [record.id]);

            const duration = Date.now() - startTime;
            Migrator.printTaskLine(record.migration, duration);
        }
        console.log('');
    }
}