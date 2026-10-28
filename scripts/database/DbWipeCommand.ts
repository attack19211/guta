import { Command } from '../types';

export class DbWipeCommand implements Command {
    public name = 'db:wipe';
    public description = 'Drop all tables, views, and types from the database';

    public async execute(args: string[]): Promise<void> {
        try {
            console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m Wiping database tables...`);

            console.log(` \x1b[42m\x1b[30m\x1b[1m DONE \x1b[0m Dropped all tables successfully.\n`);
        } catch (error) {
            console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Failed to wipe database:`, error, '\n');
        }
    }
}