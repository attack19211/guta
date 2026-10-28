import { Response } from 'express';

export function view(res: Response, viewPath: string, data: Record<string, any> = {}) {
    const templatePath = viewPath.replace(/\./g, '/');
    return res.render(templatePath, data);
}