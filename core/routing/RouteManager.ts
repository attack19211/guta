// core/routing/RouteManager.ts

import express, { Express, Router, RequestHandler } from 'express';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { trustsMiddleware } from '@/app/http/middleware/trusts.middleware';
import { trackingMiddleware } from '@/app/http/middleware/tracking.middleware';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

type Middleware = RequestHandler;

type RouteArgs = [...Middleware[], RequestHandler];

class RouteManager {
    private router: Router;
    private prefix = '';
    private middlewares: Middleware[] = [trustsMiddleware, trackingMiddleware];

    constructor() {
        this.router = express.Router();
    }

    public getRouter() {
        return this.router;
    }

    public prefixGroup(prefix: string) {
        this.prefix += prefix;
        return this;
    }

    public middleware(middleware: Middleware | Middleware[]) {
        const child = new RouteManager();

        child.prefix = this.prefix;

        child.middlewares = [
            ...this.middlewares,
            ...(Array.isArray(middleware) ? middleware : [middleware])
        ];

        return {
            group: (callback: (route: RouteManager) => void) => {
                callback(child);

                this.router.use(child.router);
            }
        };
    }

    public group(options: { prefix?: string; middleware?: Middleware[]}, callback: (route: RouteManager) => void) {
        const child = new RouteManager();

        child.prefix = this.prefix + (options.prefix || '');
        child.middlewares = [
            ...this.middlewares,
            ...(options.middleware || [])
        ];

        callback(child);

        this.router.use(child.router);
    }

    private register(method: Method, path: string, args: RouteArgs) {
        const handler = args[args.length - 1];

        const routeMiddlewares = args.slice(0, -1);

        const fullPath = this.prefix + path;

        (this.router as any)[method](
            fullPath,
            ...this.middlewares,
            ...routeMiddlewares,
            handler
        );
    }

    public get(path: string, ...args: RouteArgs) {
        this.register('get', path, args);
    }

    public post(path: string, ...args: RouteArgs) {
        this.register('post', path, args);
    }

    public put(path: string, ...args: RouteArgs) {
        this.register('put', path, args);
    }

    public delete(path: string, ...args: RouteArgs) {
        this.register('delete', path, args);
    }

    public patch(path: string, ...args: RouteArgs) {
        this.register('patch', path, args);
    }

    public match(methods: Method[], path: string, ...args: RouteArgs) {
        methods.forEach((method) => {
            this.register(method, path, args);
        });
    }
}

export const Route = new RouteManager();

export const loadRoutes = async (app: Express) => {
    const routesPath = path.join(process.cwd(), 'routes');

    if (!fs.existsSync(routesPath)) {
        console.warn('Không tìm thấy thư mục định tuyến.');

        return;
    }

    let files = fs.readdirSync(routesPath).filter((file) => file.endsWith('.routes.ts'));

    files.sort((a, b) => {
        if (a.includes('404'))
            return 1;

        if (b.includes('404'))
            return -1;

        return 0;
    });

    for (const file of files) {
        const fullPath = path.join(
            routesPath,
            file
        );

        const moduleUrl = pathToFileURL(fullPath).href;

        const module = await import(moduleUrl);

        const router = module.default;

        if (!router) {
            console.warn(`Đường dẫn tệp ${file} chưa xuất bộ định tuyến mặc định`);

            continue;
        }

        const name = file.replace('.routes.ts', '');

        const prefix = name === 'web' ? '/' : `/${name}`;

        app.use(prefix, router);
    }

    app.use((req, res) => {
        res.status(404).json({
            resultCode: 404,
            message: `E_ROUTE_NOT_FOUND: Cannot ${req.method}: ${req.originalUrl}`,
            responseTime: Date.now()
        });
    });
};