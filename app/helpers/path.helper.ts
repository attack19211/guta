// helpers/path.helper.ts
export function pathToDot(path: string): string {
    return path.replace(/^\//, '').replace(/\//g, '.');
}