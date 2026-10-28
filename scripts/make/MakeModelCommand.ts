import fs from 'fs';
import path from 'path';
import { Command } from '../types';

export class MakeModelCommand implements Command {
    public name = 'make:model';
    public description = 'Create a new model class';

    private toSnakeCase(input: string): string {
        return input
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .toLowerCase();
    }

    private pluralize(word: string): string {
        const lower = word.toLowerCase();

        const irregulars: Record<string, string> = {
            person: 'people',
            child: 'children',
            man: 'men',
            woman: 'women',
            tooth: 'teeth',
            foot: 'feet',
            mouse: 'mice',
            goose: 'geese',
        };

        if (irregulars[lower]) {
            return irregulars[lower];
        }

        if (/(s|x|z|ch|sh)$/i.test(word)) {
            return word + 'es';
        }

        if (/[^aeiou]y$/i.test(word)) {
            return word.slice(0, -1) + 'ies';
        }

        if (/[^aeiou]o$/i.test(word)) {
            return word + 'es';
        }

        if (/f$/i.test(word)) {
            return word.slice(0, -1) + 'ves';
        }

        if (/fe$/i.test(word)) {
            return word.slice(0, -2) + 'ves';
        }

        return word + 's';
    }

    public async execute(args: string[]): Promise<void> {
        const rawInput = args[0];

        if (!rawInput) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Model name is required.\n');
            return;
        }

        const normalizedInput = rawInput.replace(/\\/g, '/');
        const parts = normalizedInput.split('/').filter(Boolean);

        const rawName = parts.pop()!;
        const subDirs = parts;

        const className = rawName.charAt(0).toUpperCase() + rawName.slice(1);

        const snakeName = this.toSnakeCase(className);
        const tableName = this.pluralize(snakeName);

        const baseDir = path.join(process.cwd(), 'app', 'models');
        const targetDir = path.join(baseDir, ...subDirs);
        const modelFilePath = path.join(targetDir, `${className}.ts`);

        if (fs.existsSync(modelFilePath)) {
            console.error('\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Model already exists.\n');
            return;
        }

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const modelContent = `import { Base } from '@/core/models/Base';

export class ${className} extends Base {
    public static override tableName = '${tableName}';

    public static override fillable = [
        'createdAt',
        'updatedAt'
    ];
}
`;

        fs.writeFileSync(modelFilePath, modelContent, 'utf8');

        const relativeModelPath = path.relative(process.cwd(), modelFilePath).replace(/\\/g, '/');
        console.log(`\n \x1b[44m\x1b[37m\x1b[1m INFO \x1b[0m Model [${relativeModelPath}] created successfully.\n`);
    }
}