// app.ts

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from '@/config/app';
import { Exception } from '@/core/exceptions/ExceptionHandler';
import { bootstrap } from '@/bootstrap/app.bootstrap';
import path from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.set('view engine', 'hbs');
app.set('views', path.join(process.cwd(), 'resources', 'views'));

app.use('/static', express.static(path.join(process.cwd(), 'static')));
app.use('/storage', express.static(path.join(process.cwd(), 'storage', 'app', 'public')));

app.use(express.json({
    limit: '2048mb'
}));
app.use(express.urlencoded({
    extended: true,
    limit: '2048mb'
}));

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(session({
    secret: config('key') || 'secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(Exception.middleware());

(async () => {
    await bootstrap({app, server, io});
})();

export { app, server, io };