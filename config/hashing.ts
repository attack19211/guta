// config/hashing.ts

import { env } from '@/libs/env.lib';

/*
|--------------------------------------------------------------------------
| Default Hash Driver
|--------------------------------------------------------------------------
|
| This option controls the default hash driver that will be used to hash
| passwords for your application. By default, the bcrypt algorithm is
| used; however, you remain free to modify this option if you wish.
|
| Supported: "bcrypt", "argon", "argon2id"
|
*/

const driver = env('HASH_DRIVER', 'bcrypt');

/*
|--------------------------------------------------------------------------
| Bcrypt Options
|--------------------------------------------------------------------------
|
| Here you may specify the configuration options that should be used when
| passwords are hashed using the Bcrypt algorithm. This will allow you
| to control the amount of time it takes to hash the given password.
|
*/

const bcrypt = {
    rounds: env('BCRYPT_ROUNDS', 12),
    verify: true,
};

/*
|--------------------------------------------------------------------------
| Argon Options
|--------------------------------------------------------------------------
|
| Here you may specify the configuration options that should be used when
| passwords are hashed using the Argon algorithm. These will allow you
| to control the amount of time it takes to hash the given password.
|
*/

const argon = {
    memory: 65536,
    threads: 1,
    time: 4,
    verify: true,
};

const hashingConfig = { driver, bcrypt, argon };

export default hashingConfig;