import db from '@/config/database';
import { Command } from '../types';
import { Migrator } from './Migrator';

export class MigrateRollbackCommand implements Command {
    public name = 'migrate:rollback';
    public description = 'Rollback the last database migration batch';

    public async execute(): Promise<void> {
        await Migrator.ensureDatabaseExists();
        await Migrator.ensureMigrationsTable();
        
        const ranMigrations = await Migrator.getRanMigrations();

        if (ranMigrations.length === 0) {
            Migrator.printInfo('Nothing to rollback.');
            return;
        }

        const lastBatch = Math.max(...ranMigrations.map(m => m.batch));
        const targetMigrations = ranMigrations
            .filter(m => m.batch === lastBatch)
            .sort((a, b) => b.id - a.id);

        Migrator.printInfo('Rolling back migrations.');

        const files = Migrator.getMigrationFiles();

        for (const record of targetMigrations) {
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