import fs from 'fs';
import path from 'path';
import { Command } from '../types';

export class MakeControllerCommand implements Command {
    public name = 'make:controller';
    public description = 'Create a new controller class';

    public async execute(args: string[]): Promise<void> {
        const rawInput = args[0];
        if (!rawInput) {
            console.error('❌ Error: Controller name is required.');
            return;
        }

        const normalizedInput = rawInput.replace(/\\/g, '/');
        const parts = normalizedInput.split('/').filter(Boolean);

        const rawName = parts.pop()!;
        const subDirs = parts;

        const baseName = rawName.replace(/Controller$/i, '');
        const className = this.toPascalCase(baseName) + 'Controller';

        const fileName = `${className}.ts`;

        const baseDir = path.join(process.cwd(), 'app', 'http', 'controllers');
        const targetDir = path.join(baseDir, ...subDirs);
        const filePath = path.join(targetDir, fileName);

        if (fs.existsSync(filePath)) {
            console.error('\x1b[41m\x1b[30m ERROR \x1b[0m Controller already exists.');
            return;
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const content = `import { Request, Response } from 'express';

export class ${className} {
    public async index(req: Request, res: Response): Promise<Response> {
        return res.json({ message: 'Success' });
    }
}
`;

        fs.writeFileSync(filePath, content, 'utf8');

        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        console.log(`\n \x1b[44m\x1b[37m INFO \x1b[0m Controller [${relativePath}] created successfully.\n`);
    }

    private toPascalCase(input: string): string {
        return input
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
            .replace(/^(.)/, (c) => c.toUpperCase());
    }
}