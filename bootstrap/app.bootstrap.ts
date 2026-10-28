// bootstrap/app.bootstrap.ts

import 'dotenv/config';

process.env.TZ = process.env.APP_TIMEZONE || 'Asia/Ho_Chi_Minh';

import chalk from 'chalk';
import net from 'net';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import db from '@/config/database';
import { env } from '@/libs/env.lib';
import { loadRoutes } from '@/core/routing/RouteManager';
import { requestLogger } from '@/core/middleware/RequestLogger';
import { errorLogger } from '@/core/middleware/ErrorLogger';
import { initializeSocket } from './socket.bootstrap';
import { gracefulShutdown } from './shutdown.bootstrap';
import { registerExceptionHandlers } from './exception.bootstrap';

const execAsync = promisify(exec);

interface BootstrapOptions {
    app: any;
    server: any;
    io: any;
}

const BADGES = {
    info: chalk.bgHex('#094AE0').hex('#FFFFFF').bold(' INFO '),
    success: chalk.bgHex('#09E00D').hex('#FFFFFF').bold(' SUCCESS '),
    error: chalk.bgHex('#CC0404').hex('#FFFFFF').bold(' ERROR '),
    warn: chalk.bgHex('#F09405').hex('#FFFFFF').bold(' WARN '),
};

const TEXT_THEME = {
    brand:     chalk.hex('#C96442'),
    url:       chalk.hex('#FFFFFF').bold,
    highlight: chalk.hex('#FFFD9C').bold,
    label:     chalk.gray,
    value:     chalk.white.bold,
};

const isPortInUse = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(true);
                } else {
                    resolve(false);
                }
            })
            .once('listening', () => {
                tester.close();
                resolve(false);
            })
            .listen(port, '127.0.0.1');
    });
};

const findAvailablePort = async (startPort: number): Promise<number> => {
    let port = startPort;
    let inUse = await isPortInUse(port);
    
    while (inUse && port < startPort + 100) {
        port++;
        inUse = await isPortInUse(port);
    }
    
    return port;
};

const killProcessOnPort = async (port: number): Promise<void> => {
    const platform = process.platform;
    
    try {
        if (platform === 'win32') {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            const lines = stdout.split('\n');
            const pids = new Set<string>();
            
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid.length > 0 && !isNaN(Number(pid)) && Number(pid) > 4) {
                    pids.add(pid);
                }
            });
            
            for (const pid of pids) {
                try {
                    await execAsync(`taskkill /PID ${pid} /F`);
                } catch (e) {}
            }
        } else {
            const { stdout } = await execAsync(`lsof -ti:${port}`);
            if (stdout) {
                const pids = stdout.trim().split('\n');
                for (const pid of pids) {
                    if (pid && pid.trim().length > 0 && !isNaN(Number(pid))) {
                        try {
                            await execAsync(`kill -9 ${pid.trim()}`);
                        } catch (e) {}
                    }
                }
            }
        }
    } catch (error) {}
};

const getStorageInfo = async (): Promise<string> => {
    try {
        if (process.platform === 'win32') {
            const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
            const lines = stdout.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('Caption'));
            const firstLine = lines[0];
            if (firstLine) {
                const parts = firstLine.split(/\s+/);
                const caption = parts[0];
                const freespace = parts[1];
                const size = parts[2];
                if (caption && freespace && size) {
                    const freeGB = (parseInt(freespace, 10) / (1024 ** 3)).toFixed(1);
                    const totalGB = (parseInt(size, 10) / (1024 ** 3)).toFixed(1);
                    return `${caption} ${freeGB} GB trống / ${totalGB} GB`;
                }
            }
        } else {
            const { stdout } = await execAsync('df -h / | tail -1');
            const parts = stdout.trim().split(/\s+/);
            const size = parts[1];
            const free = parts[3];
            if (size && free) {
                return `${free} trống / ${size}`;
            }
        }
    } catch (e) {}
    return 'Không xác định';
};

const printSystemInfo = async () => {
    const rawEnv = env('APP_ENV', 'local');
    const appEnv = String(rawEnv).toUpperCase();
    
    let envColor;
    if (['PRODUCTION', 'PROD'].includes(appEnv)) {
        envColor = chalk.bgRed.white.bold(` ${appEnv} `);
    } else if (['LOCAL', 'DEVELOPMENT', 'DEV'].includes(appEnv)) {
        envColor = chalk.bgGreen.white.bold(` ${appEnv} `);
    } else {
        envColor = chalk.bgYellow.white.bold(` ${appEnv} `);
    }
    
    const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
    const usedMemGB = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const ramUsagePercent = (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1);

    const cpus = os.cpus();
    const firstCpu = cpus[0];
    const cpuName = firstCpu?.model ? firstCpu.model.trim() : os.arch();
    const hostName = `${os.hostname()} (${os.platform()} ${os.arch()})`;
    
    const storageInfo = await getStorageInfo();

    console.log(chalk.gray('─────────────────────────────────────────────────────────────────'));
    console.log(` ${TEXT_THEME.label('• Môi trường        :')} ${envColor}`);
    console.log(` ${TEXT_THEME.label('• Phiên bản Node/OS :')} ${TEXT_THEME.value(process.version)} ${chalk.gray('/')} ${TEXT_THEME.value(os.type() + ' ' + os.release())}`);
    console.log(` ${TEXT_THEME.label('• Tên máy chủ       :')} ${TEXT_THEME.value(hostName)}`);
    console.log(` ${TEXT_THEME.label('• Tên bộ xử lý (CPU):')} ${TEXT_THEME.value(cpuName)}`);
    console.log(` ${TEXT_THEME.label('• Bộ nhớ (RAM)      :')} ${TEXT_THEME.value(`${usedMemGB} GB / ${totalMemGB} GB`)} ${chalk.gray(`(Đã dùng ${ramUsagePercent}%, Trống ${freeMemGB} GB)`)}`);
    console.log(` ${TEXT_THEME.label('• Lưu trữ (Disk)    :')} ${TEXT_THEME.value(storageInfo)}`);
    console.log(chalk.gray('─────────────────────────────────────────────────────────────────'));
};

const drawHackerText = () => {
    const text = [
        '          _____                _____                _____                    _____                    _____                    _____          ',
        '         /\\    \\              /\\    \\              /\\    \\                  /\\    \\                  /\\    \\                  /\\    \\         ',
        '        /::\\    \\            /::\\    \\            /::\\    \\                /::\\    \\                /::\\    \\                /::\\____\\        ',
        '       /::::\\    \\           \\:::\\    \\           \\:::\\    \\              /::::\\    \\              /::::\\    \\              /:::/    /        ',
        '      /::::::\\    \\           \\:::\\    \\           \\:::\\    \\            /::::::\\    \\            /::::::\\    \\            /:::/    /         ',
        '     /:::/\\:::\\    \\           \\:::\\    \\           \\:::\\    \\          /:::/\\:::\\    \\          /:::/\\:::\\    \\          /:::/    /          ',
        '    /:::/__\\:::\\    \\           \\:::\\    \\           \\:::\\    \\        /:::/__\\:::\\    \\        /:::/  \\:::\\    \\        /:::/____/           ',
        '   /::::\\   \\:::\\    \\          /::::\\    \\          /::::\\    \\      /::::\\   \\:::\\    \\      /:::/    \\:::\\    \\      /::::\\    \\           ',
        '  /::::::\\   \\:::\\    \\        /::::::\\    \\        /::::::\\    \\    /::::::\\   \\:::\\    \\    /:::/    / \\:::\\    \\    /::::::\\____\\________  ',
        ' /:::/\\:::\\   \\:::\\    \\      /:::/\\:::\\    \\      /:::/\\:::\\    \\  /:::/\\:::\\   \\:::\\    \\  /:::/    /   \\:::\\    \\  /:::/\\:::::::::::\\    \\ ',
        '/:::/  \\:::\\   \\:::\\____\\    /:::/  \\:::\\____\\    /:::/  \\:::\\____\\/:::/  \\:::\\   \\:::\\____\\/:::/____/     \\:::\\____\\/:::/  |:::::::::::\\____\\',
        '\\::/    \\:::\\  /:::/    /   /:::/    \\::/    /   /:::/    \\::/    /\\::/    \\:::\\  /:::/    /\\:::\\    \\      \\::/    /\\::/   |::|~~~|~~~~~     ',
        ' \\/____/ \\:::\\/:::/    /   /:::/    / \\/____/   /:::/    / \\/____/  \\/____/ \\:::\\/:::/    /  \\:::\\    \\      \\/____/  \\/____|::|   |          ',
        '          \\::::::/    /   /:::/    /           /:::/    /                    \\::::::/    /    \\:::\\    \\                    |::|   |          ',
        '           \\::::/    /   /:::/    /           /:::/    /                      \\::::/    /      \\:::\\    \\                   |::|   |          ',
        '           /:::/    /    \\::/    /            \\::/    /                       /:::/    /        \\:::\\    \\                  |::|   |          ',
        '          /:::/    /      \\/____/              \\/____/                       /:::/    /          \\:::\\    \\                 |::|   |          ',
        '         /:::/    /                                                         /:::/    /            \\:::\\    \\                |::|   |          ',
        '        /:::/    /                                                         /:::/    /              \\:::\\____\\               \\::|   |          ',
        '        \\::/    /                                                          \\::/    /                \\::/    /                \\:|   |          ',
        '         \\/____/                                                            \\/____/                  \\/____/                  \\|___|          ',
    ];

    console.log('');
    text.forEach(line => {
        console.log(TEXT_THEME.brand(line));
    });
};

export const bootstrap = async ({ app, server, io } : BootstrapOptions) => {
    try {
        console.clear();
        registerExceptionHandlers();
        drawHackerText();
        
        app.set('trust proxy', true);
        app.use(requestLogger);

        await loadRoutes(app);

        initializeSocket(io);

        app.use(errorLogger);

        const rawPort = env('APP_PORT', 5000);
        let PORT = typeof rawPort === 'number' ? rawPort : parseInt(String(rawPort ?? 5000), 10);
        if (isNaN(PORT) || PORT <= 0) {
            PORT = 5000;
        }
        
        const rawHost = env('APP_HOST', '127.0.0.1');
        const HOST = String(rawHost ?? '127.0.0.1');

        if (await isPortInUse(PORT)) {
            await killProcessOnPort(PORT);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (await isPortInUse(PORT)) {
                PORT = await findAvailablePort(PORT + 1);
            }
        }

        await new Promise<void>((resolve, reject) => {
            server.once('error', (error: any) => {
                console.log('');
                console.log(`${BADGES.error} ${error?.message || error}`);
                reject(error);
            });

            server.listen(PORT, HOST, () => {
                resolve();
            });
        });

        db.connectDB().then(() => {}).catch(() => {});
        
        console.log('');
        console.log(`${BADGES.info} Server running on [${TEXT_THEME.url(`http://${HOST}:${PORT}`)}].`);
        
        await printSystemInfo();
        
        console.log('');
        console.log(TEXT_THEME.highlight('Press Ctrl + C to stop the server'));
        console.log('');

        process.on('SIGINT', () => gracefulShutdown(server));
        process.on('SIGTERM', () => gracefulShutdown(server));

    } catch (error: any) {
        console.log('');
        console.log(`${BADGES.error} ${error?.message || error}`);
        console.log('');
        process.exit(1);
    }
};