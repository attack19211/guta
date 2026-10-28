import chalk from 'chalk';
import { Request, Response, NextFunction } from 'express';

const CONFIG = {
    URL_WIDTH: 60,
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;

    const originalSend = res.json;

    res.json = function (body) {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        const now = new Date();
        const dateStr = formatDate(now);
        const timeStr = formatTime(now);

        const methodBadgeFormatted = getMethodBadge(method);

        let urlDisplay = originalUrl || '/';
        if (urlDisplay.length > CONFIG.URL_WIDTH) {
            urlDisplay = urlDisplay.substring(0, CONFIG.URL_WIDTH - 3) + '...';
        }

        const dotsLength = Math.max(0, CONFIG.URL_WIDTH - urlDisplay.length);
        const dots = '.'.repeat(dotsLength);

        const statusColor = getStatusColor(statusCode);
        const timeDisplay = responseTime > 1000 ? `${(responseTime / 1000).toFixed(1)}s` : `${responseTime}ms`;

        console.log(
            `${chalk.gray(dateStr)} ${chalk.hex("#FFFFFF")(timeStr)} ${methodBadgeFormatted} ${chalk.white(urlDisplay)}${chalk.gray(dots)} ${statusColor} ~ ${chalk.white(timeDisplay)}`
        );

        return originalSend.call(this, body);
    };

    res.on('error', (error: any) => {
        const now = new Date();
        const dateStr = formatDate(now);
        const timeStr = formatTime(now);
        const methodBadgeFormatted = getMethodBadge(method);

        let urlDisplay = originalUrl || '/';
        if (urlDisplay.length > CONFIG.URL_WIDTH) {
            urlDisplay = urlDisplay.substring(0, CONFIG.URL_WIDTH - 3) + '...';
        }

        const dotsLength = Math.max(0, CONFIG.URL_WIDTH - urlDisplay.length);
        const dots = '.'.repeat(dotsLength);

        console.log(
            `${chalk.gray(dateStr)} ${chalk.hex("#FFFFFF")(timeStr)} ${methodBadgeFormatted} ${chalk.white(urlDisplay)}${chalk.gray(dots)} ${chalk.red('ERROR')} ${chalk.red(error.message)}`
        );
    });

    next();
};

const getMethodBadge = (method: string): string => {
    const badges: Record<string, string> = {
        GET: chalk.bgHex('#094AE0').hex('#FFFFFF').bold(' GET '),
        POST: chalk.bgHex('#09E058').hex('#FFFFFF').bold(' POST '),
        PUT: chalk.bgHex('#FCA130').hex('#FFFFFF').bold(' PUT '),
        PATCH: chalk.bgHex('#CC8CFF').hex('#FFFFFF').bold(' PATCH '),
        DELETE: chalk.bgHex('#F93E3E').hex('#FFFFFF').bold(' DELETE '),
        OPTIONS: chalk.bgHex('#F945FF').hex('#FFFFFF').bold(' OPT '),
        HEAD: chalk.bgHex('#45FF89').hex('#FFFFFF').bold(' HEAD '),
    };
    return badges[method] || chalk.bgHex('#4B5563').hex('#FFFFFF').bold(` ${method} `);
};

const getStatusColor = (statusCode: number) => {
    const codeStr = ` ${statusCode} `;
    if (statusCode >= 500) return chalk.bgRed.white.bold(codeStr);
    if (statusCode >= 400) return chalk.bgYellow.white.bold(codeStr);
    if (statusCode >= 300) return chalk.bgCyan.white.bold(codeStr);
    if (statusCode >= 200) return chalk.bgGreen.white.bold(codeStr);
    return chalk.bgGray.white.bold(codeStr);
};

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};