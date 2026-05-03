import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import generateRoutes from './src/routes/generate.js';

const app = express();

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(generateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
