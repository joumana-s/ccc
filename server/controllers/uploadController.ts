import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export function uploadHandler(req: Request, res: Response) {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const files = req.files as Express.Multer.File[];
    console.log(`Uploaded ${files.length} files:`, files.map(f => f.filename));
    // Copy each uploaded file to dist/public/images
    files.forEach(file => {
        const src = path.join('public/images', file.filename);
        const dest = path.join('dist/public/images', file.filename);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    });
    res.json({
        message: 'Files uploaded successfully',
        files: files.map(file => ({
            filename: file.filename,
            path: `/images/${file.filename}`
        }))
    });
} 