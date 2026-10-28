// core/middleware/ErrorLogger.ts

import { log } from '@/config/logging';
import chalk from 'chalk';
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.log('');
    console.log(chalk.bgRed.black(' ERROR '));
    console.log(chalk.red(`  Time:    ${new Date().toISOString()}`));
    console.log(chalk.red(`  Method:  ${req.method}`));
    console.log(chalk.red(`  URL:     ${req.originalUrl}`));
    console.log(chalk.red(`  Status:  ${statusCode}`));
    console.log(chalk.red(`  Message: ${message}`));
    
    if (process.env.APP_ENV === 'development') {
        console.log(chalk.gray(`  Stack:   ${err.stack}`));
    }
    
    console.log('');

    log.error(
        `${req.method} ${req.originalUrl} - ${statusCode} - ${message}\n` + `Error Stack: ${err.stack}\n` + `Request Details: ${JSON.stringify({
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            body: req.body,
            query: req.query,
            params: req.params,
        }, null, 2)}`
    );

    res.status(statusCode).json({
        success: false,
        statusCode,
        message: process.env.APP_ENV === 'development' ? message : 'Internal Server Error',
        ...(process.env.APP_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString(),
        path: req.originalUrl
    });
};