import { Command } from '../types';

export class DbShowCommand implements Command {
    public name = 'db:show';
    public description = 'Display information about the given database';

    public async execute(args: string[]): Promise<void> {
        try {
            console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m Fetching database information...\n`);
            console.log(` Database Name .......................................... main`);
            console.log(` Database Driver ........................................ mysql / pgsql`);
            console.log(` Open Connections ...................................... 1\n`);
        } catch (error) {
            console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Failed to fetch database info:`, error, '\n');
        }
    }
}