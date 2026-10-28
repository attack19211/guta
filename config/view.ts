// config/view.ts

import { env } from '@/libs/env.lib';

/*
|--------------------------------------------------------------------------
| View Storage Paths
|--------------------------------------------------------------------------
|
| Most templating systems load templates from disk. Here you may specify
| an array of paths that should be checked for your views. Of course
| the usual ATTACK view path has already been registered for you.
|
*/

const paths = [
    process.cwd() + '/resources/views',
];

/*
|--------------------------------------------------------------------------
| Compiled View Path
|--------------------------------------------------------------------------
|
| This option determines where all the compiled Blade templates will be
| stored for your application. Typically, this is within the storage
| directory. However, as usual, you are free to change this value.
|
*/

const compiled = env('VIEW_COMPILED_PATH', process.cwd() + '/storage/framework/views');

const viewConfig = { paths, compiled };

export default viewConfig;