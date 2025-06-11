import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export function uploadHandler(req: Request, res: Response) {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files;
    
    try {
        // Copy each uploaded file to dist/public/images
        files.forEach(file => {
            const src = path.resolve(process.cwd(), 'public', 'images', file.filename);
            const dest = path.resolve(process.cwd(), 'dist', 'public', 'images', file.filename);
            
            // Ensure the destination directory exists
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            
            // Copy the file
            fs.copyFileSync(src, dest);
        });

        res.json({
            message: 'Files uploaded successfully',
            files: files.map(file => ({
                filename: file.filename,
                path: `/images/${file.filename}`
            }))
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to process uploaded files'
        });
    }
} 