import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import generateRoutes from './routes/generate.js';
import widgetRoutes from './routes/widget.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const app = express();

app.use(cors());
app.use(express.static(publicDir));
app.use(express.json());
app.use(generateRoutes);
app.use(widgetRoutes);

export default app;
