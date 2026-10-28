import fs from 'fs';
import path from 'path';
import { Command } from '../types';

export class MakeViewCommand implements Command {
    public name = 'make:view';
    public description = 'Create a new view file';

    public async execute(args: string[]): Promise<void> {
        const rawInput = args[0];
        if (!rawInput) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m View name is required.\n');
            return;
        }

        const normalizedInput = rawInput.replace(/\\/g, '/');
        const parts = normalizedInput.split('/').filter(Boolean);

        const rawName = parts.pop()!;
        const subDirs = parts;

        const viewName = rawName.toLowerCase().replace(/\.hbs$/, '');

        const baseDir = path.join(process.cwd(), 'resources', 'views');
        const targetDir = path.join(baseDir, ...subDirs);
        const filePath = path.join(targetDir, `${viewName}.hbs`);

        if (fs.existsSync(filePath)) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m View already exists.\n');
            return;
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const content = `<div>
    <h1>${viewName} View</h1>
</div>
`;

        fs.writeFileSync(filePath, content, 'utf8');

        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m View [${relativePath}] created successfully.\n`);
    }
}