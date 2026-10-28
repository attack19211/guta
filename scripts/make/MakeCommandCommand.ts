import fs from 'fs';
import path from 'path';
import { Command } from '../types';

export class MakeCommandCommand implements Command {
    public name = 'make:command';
    public description = 'Create a new Artisan command';

    public async execute(args: string[]): Promise<void> {
        const rawInput = args[0];
        if (!rawInput) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Command name is required.\n');
            return;
        }

        const normalizedInput = rawInput.replace(/\\/g, '/');
        const parts = normalizedInput.split('/').filter(Boolean);

        const rawName = parts.pop()!;
        const subDirs = parts;

        const nameWithSuffix = rawName.endsWith('Command') ? rawName : `${rawName}Command`;
        const className = nameWithSuffix.charAt(0).toUpperCase() + nameWithSuffix.slice(1);

        const baseDir = path.join(process.cwd(), 'app', 'console', 'commands');
        const targetDir = path.join(baseDir, ...subDirs);
        const filePath = path.join(targetDir, `${className}.ts`);

        if (fs.existsSync(filePath)) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Command already exists.\n');
            return;
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const content = `import { Command } from '../../types';

export class ${className} implements Command {
    public name = 'custom:command';
    public description = 'Custom command description';

    public async execute(args: string[]): Promise<void> {
        console.log('Running ${className}...');
    }
}
`;

        fs.writeFileSync(filePath, content, 'utf8');

        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m Command [${relativePath}] created successfully.\n`);
    }
}