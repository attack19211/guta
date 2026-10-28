import db from '@/config/database';
import { Command } from './scripts/types';
import { commands } from './scripts/index';

const APP_NAME = 'ATTACK Framework';
const APP_VERSION = '1.0.0';

const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    bgGreen: '\x1b[42m\x1b[30m\x1b[1m',
};

function renderHelp(): void {
    console.log();
    console.log(` ${c.bold}${c.green}${APP_NAME}${c.reset} ${c.dim}v${APP_VERSION}${c.reset}`);
    console.log();

    console.log(` ${c.yellow}Usage:${c.reset}`);
    console.log(`   command [options] [arguments]\n`);

    console.log(` ${c.yellow}Options:${c.reset}`);
    console.log(`   ${c.green}-h, --help${c.reset}${' '.repeat(13)}Display help for the given command`);
    console.log(`   ${c.green}-V, --version${c.reset}${' '.repeat(10)}Display this application version`);
    console.log(`   ${c.green}-v|vv|vvv, --verbose${c.reset}${' '.repeat(3)}Increase the verbosity of messages\n`);

    console.log(` ${c.yellow}Available commands:${c.reset}`);

    const maxLen = Math.max(...commands.map((cmd: Command) => cmd.name.length), 20);
    const padLen = maxLen + 3;

    const groups: Record<string, Command[]> = {};

    commands.forEach((cmd: Command) => {
        const parts = cmd.name.split(':');
        const groupName = parts.length > 1 && parts[0] ? parts[0] : '_root';

        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName]!.push(cmd);
    });

    const rootCommands = groups['_root'];
    if (rootCommands) {
        rootCommands.forEach((cmd: Command) => {
            const paddedName = cmd.name.padEnd(padLen, ' ');
            console.log(`  ${c.green}${paddedName}${c.reset}${cmd.description}`);
        });
        delete groups['_root'];
    }

    const sortedGroups = Object.keys(groups).sort();
    sortedGroups.forEach(group => {
        console.log(` ${c.yellow}${group}${c.reset}`);
        const groupCommands = groups[group];
        if (groupCommands) {
            groupCommands.forEach((cmd: Command) => {
                const paddedName = cmd.name.padEnd(padLen, ' ');
                console.log(`  ${c.green}${paddedName}${c.reset}${cmd.description}`);
            });
        }
    });

    console.log();
}

async function run(): Promise<void> {
    const args = process.argv.slice(2);
    const commandName = args[0];

    if (!commandName || commandName === '-h' || commandName === '--help') {
        renderHelp();
        return;
    }

    if (commandName === '-V' || commandName === '--version') {
        console.log(`\n ${c.green}${APP_NAME}${c.reset} version ${c.yellow}${APP_VERSION}${c.reset}\n`);
        return;
    }

    const command = commands.find((cmd: Command) => cmd.name === commandName);

    if (!command) {
        console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Command "${commandName}" is not defined.\n`);
        process.exit(1);
    }

    let hasError = false;

    try {
        await command.execute(args.slice(1));
    } catch (error) {
        hasError = true;
        console.error(`\n \x1b[41m\x1b[37m\x1b[1m ERROR \x1b[0m Command failed:`, error, '\n');
    } finally {
        const dbAny = db as any;
        if (dbAny && typeof dbAny.close === 'function') {
            await dbAny.close();
        } else if (dbAny && typeof dbAny.destroy === 'function') {
            await dbAny.destroy();
        }

        process.exit(hasError ? 1 : 0);
    }
}

run();