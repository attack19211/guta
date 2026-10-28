import { Command } from '../types';
import { MigrateResetCommand } from './MigrateResetCommand';
import { MigrateCommand } from './MigrateCommand';

export class MigrateRefreshCommand implements Command {
    public name = 'migrate:refresh';
    public description = 'Reset and re-run all migrations';

    public async execute(): Promise<void> {
        const resetCmd = new MigrateResetCommand();
        await resetCmd.execute();

        const migrateCmd = new MigrateCommand();
        await migrateCmd.execute();
    }
}