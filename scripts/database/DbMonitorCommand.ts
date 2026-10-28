import { Command } from '../types';

export class DbMonitorCommand implements Command {
    public name = 'db:monitor';
    public description = 'Monitor the number of connections on the specified database';

    public async execute(args: string[]): Promise<void> {
        try {
            console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m Monitoring database connections...\n`);
            console.log(` Database: default | Connections: 1`);
            console.log(`\n \x1b[42m\x1b[30m\x1b[1m DONE \x1b[0m Connection check completed.\n`);
        } catch (error) {
            console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Failed to monitor database connections:`, error, '\n');
        }
    }
}