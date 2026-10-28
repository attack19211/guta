// scripts/database/DbSeedCommand.ts
import fs from 'fs';
import path from 'path';
import { Command } from '../types';
import { pathToFileURL } from 'url';

export class DbSeedCommand implements Command {
    public name = 'db:seed';
    public description = 'Seed the database with records';

    public async execute(args: string[]): Promise<void> {
        let seederName = 'DatabaseSeeder';

        const classArg = args.find(arg => arg.startsWith('--class='));
        if (classArg) {
            const extractedName = classArg.split('=')[1];
            if (extractedName) {
                seederName = extractedName;
            }
        } else if (args[0] && !args[0].startsWith('--')) {
            seederName = args[0];
        }

        seederName = seederName.endsWith('Seeder') ? seederName : `${seederName}Seeder`;
        const className = seederName.charAt(0).toUpperCase() + seederName.slice(1);
        const filePath = path.join(process.cwd(), 'database', 'seeders', `${className}.ts`);

        if (!fs.existsSync(filePath)) {
            console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Seeder [${className}] does not exist.\n`);
            return;
        }

        try {
            console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m Running seeder: ${className}...`);

            const fileUrl = pathToFileURL(filePath).href;
            const seederModule = await import(fileUrl);
            
            const SeederClass = seederModule[className] || seederModule.default;

            if (!SeederClass) {
                console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Class [${className}] not found in file.\n`);
                return;
            }

            const seederInstance = new SeederClass();
            if (typeof seederInstance.run === 'function') {
                await seederInstance.run();
                console.log(` \x1b[42m\x1b[30m\x1b[1m DONE \x1b[0m Database seeding completed successfully.\n`);
            } else {
                console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Method 'run()' missing in [${className}].\n`);
            }
        } catch (error) {
            console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Failed to run seeder [${className}]:`, error, '\n');
        }
    }
}