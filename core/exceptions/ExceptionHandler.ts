// core/exceptions/ExceptionHandler.ts

import { Request, Response, NextFunction } from 'express';
import { log } from '@/config/logging';

export class HttpException extends Error {
    public statusCode: number;
    public code: string;
    public errors: any;

    constructor(options: {
        statusCode?: number;
        code?: string;
        message?: string;
        errors?: any;
    } = {}) {
        super(options.message || 'Đã xảy ra lỗi hệ thống.');
        this.name = 'HttpException';
        this.statusCode = options.statusCode || 500;
        this.code = options.code || 'E_INTERNAL_SERVER';
        this.errors = options.errors || null;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ExceptionHandler {
    public middleware() {
        return (error: any, req: Request, res: Response, next: NextFunction) => {
            const statusCode = error instanceof HttpException ? error.statusCode : 500;
            const code = error instanceof HttpException ? error.code : 'E_INTERNAL_SERVER';
            const message = error instanceof HttpException ? error.message : 'Đã xảy ra lỗi hệ thống.';
            const errors = error instanceof HttpException ? error.errors : null;

            log.error(`[${code}] ${message}`, {
                code,
                method: req.method,
                originalUrl: req.originalUrl,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                body: req.body,
                query: req.query,
                params: req.params,
                stack: error.stack,
                errors
            });

            return res.status(statusCode).json({
                success: false,
                code,
                message,
                errors,
                timestamp: Date.now()
            });
        };
    }

    public notFound() {
        return (req: Request, res: Response) => {
            log.warning('Route not found', {
                method: req.method,
                originalUrl: req.originalUrl,
                ipAddress: req.ip
            });

            return res.status(404).json({
                success: false,
                code: 'E_ROUTE_NOT_FOUND',
                message: `E_ROUTE_NOT_FOUND: Cannot ${req.method}: ${req.originalUrl}`,
                timestamp: Date.now()
            });
        };
    }
}

export const Exception = new ExceptionHandler();

export default Exception;