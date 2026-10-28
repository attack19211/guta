import { Command } from '../types';

export class DbTableCommand implements Command {
    public name = 'db:table';
    public description = 'Display information about the given database table';

    public async execute(args: string[]): Promise<void> {
        const tableName = args[0];
        if (!tableName) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Table name is required.\n');
            return;
        }

        try {
            console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m Inspecting table [${tableName}]...\n`);
            console.log(` Table ................................................. ${tableName}`);
            console.log(` Columns ............................................... 0`);
            console.log(` Size .................................................. 0 KB\n`);
        } catch (error) {
            console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Failed to inspect table [${tableName}]:`, error, '\n');
        }
    }
}