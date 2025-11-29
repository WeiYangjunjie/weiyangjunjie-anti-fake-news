import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// 允许未登录用户上传（注册头像/访客上传）；如需限制可改为 authenticate
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    // Construct public URL
    // Assuming server is running on localhost:3000
    // In production, this should be configured via env var
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({ url: fileUrl });
});

export default router;
