import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^\w-]+/g, '_')
      .slice(0, 40);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${baseName || 'image'}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('仅支持图片上传'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  upload.array('files', 6)(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    const files = (req.files as Express.Multer.File[]) || [];
    const data = files.map((file) => ({
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
    }));
    res.json({ success: true, data });
  });
});

router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, message: '图片大小不能超过5MB' });
      return;
    }
    res.status(400).json({ success: false, message: '上传失败，请重试' });
    return;
  }
  if (err?.message?.includes('仅支持图片')) {
    res.status(400).json({ success: false, message: '仅支持图片上传' });
    return;
  }
  res.status(500).json({ success: false, message: '上传失败，请稍后再试' });
});

export default router;
