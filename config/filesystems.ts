// config/filesystems.ts

import { env } from '@/libs/env.lib';

/*
|--------------------------------------------------------------------------
| Default Filesystem Disk
|--------------------------------------------------------------------------
|
| Here you may specify the default filesystem disk that should be used
| by the framework. The "local" disk, as well as a variety of cloud
| based disks are available to your application for file storage.
|
*/

const defaultDisk = env('FILESYSTEM_DISK', 'local');

/*
|--------------------------------------------------------------------------
| Filesystem Disks
|--------------------------------------------------------------------------
|
| Here you may configure as many filesystem "disks" as you wish, and you
| may even configure multiple disks of the same driver. Defaults have
| been set up for each driver as an example of the required values.
|
| Supported Drivers: "local", "ftp", "sftp", "s3"
|
*/

const disks = {
    local: {
        driver: 'local',
        root: env('LOCAL_STORAGE_PATH', 'storage/app'),
        throw: false,
    },

    public: {
        driver: 'local',
        root: env('PUBLIC_STORAGE_PATH', 'storage/app/public'),
        url: env('APP_URL', 'http://localhost') + '/storage',
        visibility: 'public',
        throw: false,
    },

    s3: {
        driver: 's3',
        key: env('AWS_ACCESS_KEY_ID', ''),
        secret: env('AWS_SECRET_ACCESS_KEY', ''),
        region: env('AWS_DEFAULT_REGION', 'us-east-1'),
        bucket: env('AWS_BUCKET', ''),
        url: env('AWS_URL', ''),
        endpoint: env('AWS_ENDPOINT', ''),
        use_path_style_endpoint: env('AWS_USE_PATH_STYLE_ENDPOINT', false),
        throw: false,
    },

    r2: {
        driver: 's3',
        key: env('R2_ACCESS_KEY_ID', ''),
        secret: env('R2_SECRET_ACCESS_KEY', ''),
        region: env('R2_REGION', 'auto'),
        bucket: env('R2_BUCKET', ''),
        endpoint: env('R2_ENDPOINT', ''),
        url: env('R2_URL', ''),
        use_path_style_endpoint: true,
        throw: false,
    },

    ftp: {
        driver: 'ftp',
        host: env('FTP_HOST', ''),
        username: env('FTP_USERNAME', ''),
        password: env('FTP_PASSWORD', ''),
        port: parseInt(env('FTP_PORT', '21')),
        root: env('FTP_ROOT', ''),
        passive: env('FTP_PASSIVE', true),
        ssl: env('FTP_SSL', false),
        timeout: parseInt(env('FTP_TIMEOUT', '30')),
        throw: false,
    },

    sftp: {
        driver: 'sftp',
        host: env('SFTP_HOST', ''),
        username: env('SFTP_USERNAME', ''),
        password: env('SFTP_PASSWORD', ''),
        privateKey: env('SFTP_PRIVATE_KEY', ''),
        port: parseInt(env('SFTP_PORT', '22')),
        root: env('SFTP_ROOT', ''),
        timeout: parseInt(env('SFTP_TIMEOUT', '30')),
        throw: false,
    },
};

/*
|--------------------------------------------------------------------------
| Symbolic Links
|--------------------------------------------------------------------------
|
| Here you may configure the symbolic links that will be created when the
| `storage:link` Artisan command is executed. The array keys should be
| the locations of the links and the values should be their targets.
|
*/

const links = {
    public_path: 'storage/app/public',
};

const filesystemsConfig = { default: defaultDisk, disks, links };

export default filesystemsConfig;