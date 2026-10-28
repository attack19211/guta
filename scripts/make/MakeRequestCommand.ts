import fs from 'fs';
import path from 'path';
import { Command } from '../types';

export class MakeRequestCommand implements Command {
    public name = 'make:request';
    public description = 'Create a new form request class';

    public async execute(args: string[]): Promise<void> {
        const rawInput = args[0];
        if (!rawInput) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Request name is required.\n');
            return;
        }

        const normalizedInput = rawInput.replace(/\\/g, '/');
        const parts = normalizedInput.split('/').filter(Boolean);

        const rawName = parts.pop()!;
        const subDirs = parts;

        const nameWithSuffix = rawName.endsWith('Request') ? rawName : `${rawName}Request`;
        const className = nameWithSuffix.charAt(0).toUpperCase() + nameWithSuffix.slice(1);

        const baseDir = path.join(process.cwd(), 'app', 'http', 'requests');
        const targetDir = path.join(baseDir, ...subDirs);
        const filePath = path.join(targetDir, `${className}.ts`);

        if (fs.existsSync(filePath)) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Request already exists.\n');
            return;
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const content = `export class ${className} {
    public authorize(): boolean {
        return true;
    }

    public rules(): Record<string, string> {
        return {};
    }
}
`;

        fs.writeFileSync(filePath, content, 'utf8');

        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m Request [${relativePath}] created successfully.\n`);
    }
}