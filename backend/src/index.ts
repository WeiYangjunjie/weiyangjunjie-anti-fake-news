import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import newsRoutes from './routes/news';
import commentRoutes from './routes/comments';
import voteRoutes from './routes/votes';
import uploadRoutes from './routes/upload';
import path from 'path';

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow serving static files
app.use(morgan('dev'));
app.use(express.json());

// 确保上传目录存在，避免首次上传时报错
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/news', newsRoutes);
app.use('/news/:newsId/comments', commentRoutes);
app.use('/news/:newsId/vote', voteRoutes);
app.use('/comments', commentRoutes);
app.use('/upload', uploadRoutes);

app.get('/', (req, res) => {
    res.send('Social Anti-Fake News Backend API');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
