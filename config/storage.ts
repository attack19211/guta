// config/storage.ts
import fs from 'fs';
import path from 'path';
import filesystemsConfig from './filesystems';

interface DiskConfig {
    driver: string;
    root?: string;
    url?: string;
    visibility?: string;
    throw?: boolean;
    key?: string;
    secret?: string;
    region?: string;
    bucket?: string;
    endpoint?: string;
    use_path_style_endpoint?: boolean;
    host?: string;
    username?: string;
    password?: string;
    port?: number;
    passive?: boolean;
    ssl?: boolean;
    timeout?: number;
    privateKey?: string;
}

class StorageManager {
    private disks: Record<string, DiskConfig>;

    constructor() {
        this.disks = filesystemsConfig.disks as Record<string, DiskConfig>;
    }

    public disk(name?: string): DiskConfig {
        const diskName = name || filesystemsConfig.default;
        const disk = this.disks[diskName];
        if (!disk) {
            throw new Error(`Thư mục "${diskName}" không tồn tại.`);
        }
        return disk;
    }

    public async put(filePath: string, content: Buffer | string, mimeType?: string): Promise<string> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, filePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content);

        return this.getUrl(filePath);
    }

    public async get(filePath: string): Promise<Buffer> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, filePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Tệp không tồn tại: ${filePath}`);
        }

        return fs.readFileSync(fullPath);
    }

    public async delete(filePath: string): Promise<boolean> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, filePath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            return true;
        }

        return false;
    }

    public async exists(filePath: string): Promise<boolean> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, filePath);
        return fs.existsSync(fullPath);
    }

    public getUrl(filePath: string): string {
        const disk = this.disk();
        if (disk.url) {
            return `${disk.url}/${filePath}`;
        }
        return `/${filePath}`;
    }

    public getFullPath(filePath: string): string {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        return path.join(rootPath, filePath);
    }

    public async makeDirectory(directory: string): Promise<boolean> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, directory);

        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            return true;
        }

        return false;
    }

    public async files(directory: string): Promise<string[]> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, directory);

        if (!fs.existsSync(fullPath)) {
            return [];
        }

        return fs.readdirSync(fullPath).filter((item) => {
            const itemPath = path.join(fullPath, item);
            return fs.statSync(itemPath).isFile();
        });
    }

    public async allFiles(directory: string): Promise<string[]> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, directory);

        if (!fs.existsSync(fullPath)) {
            return [];
        }

        const result: string[] = [];
        const items = fs.readdirSync(fullPath);

        for (const item of items) {
            const itemPath = path.join(fullPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                const subFiles = await this.allFiles(path.join(directory, item));
                result.push(...subFiles);
            } else {
                result.push(path.join(directory, item));
            }
        }

        return result;
    }

    public async size(filePath: string): Promise<number> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, filePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File không tồn tại: ${filePath}`);
        }

        return fs.statSync(fullPath).size;
    }

    public async lastModified(filePath: string): Promise<Date> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, filePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Tệp không tồn tại: ${filePath}`);
        }

        return new Date(fs.statSync(fullPath).mtimeMs);
    }

    public async copy(from: string, to: string): Promise<boolean> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fromPath = path.join(rootPath, from);
        const toPath = path.join(rootPath, to);

        if (!fs.existsSync(fromPath)) {
            throw new Error(`File nguồn không tồn tại: ${from}`);
        }

        const toDir = path.dirname(toPath);
        if (!fs.existsSync(toDir)) {
            fs.mkdirSync(toDir, { recursive: true });
        }

        fs.copyFileSync(fromPath, toPath);
        return true;
    }

    public async move(from: string, to: string): Promise<boolean> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fromPath = path.join(rootPath, from);
        const toPath = path.join(rootPath, to);

        if (!fs.existsSync(fromPath)) {
            throw new Error(`Tệp nguồn không tồn tại: ${from}`);
        }

        const toDir = path.dirname(toPath);
        if (!fs.existsSync(toDir)) {
            fs.mkdirSync(toDir, { recursive: true });
        }

        fs.renameSync(fromPath, toPath);
        return true;
    }

    public async getMimeType(filePath: string): Promise<string | null> {
        const disk = this.disk();
        const rootPath = disk.root || 'storage/app';
        const fullPath = path.join(rootPath, filePath);

        if (!fs.existsSync(fullPath)) {
            return null;
        }

        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const mimeTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff',
            'ico': 'image/x-icon',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'rtf': 'application/rtf',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'json': 'application/json',
            'xml': 'application/xml',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            'tar': 'application/x-tar',
            'gz': 'application/gzip',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'mp4': 'video/mp4',
            'mpeg': 'video/mpeg',
            'webm': 'video/webm',
            'mov': 'video/quicktime',
            'ttf': 'font/ttf',
            'otf': 'font/otf',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
        };

        return mimeTypes[ext] || null;
    }
}

const storage = new StorageManager();
export default storage;