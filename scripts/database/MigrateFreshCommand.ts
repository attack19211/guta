import { Command } from '../types';
import { Migrator } from './Migrator';
import { MigrateCommand } from './MigrateCommand';

export class MigrateFreshCommand implements Command {
    public name = 'migrate:fresh';
    public description = 'Drop all tables and re-run all migrations';

    public async execute(): Promise<void> {
        console.log('');
        const startTime = Date.now();
        await Migrator.dropAllTables();
        const duration = Date.now() - startTime;

        Migrator.printTaskLine('Dropping all tables', duration);

        const migrateCmd = new MigrateCommand();
        await migrateCmd.execute();
    }
}