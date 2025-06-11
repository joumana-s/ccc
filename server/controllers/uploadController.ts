import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export function uploadHandler(req: Request, res: Response) {
    console.log('Upload handler called');
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        console.error('No files in request or invalid files array');
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files;
    console.log(`Processing ${files.length} files:`, files.map(f => ({
        filename: f.filename,
        originalname: f.originalname,
        size: f.size,
        mimetype: f.mimetype
    })));
    
    try {
        // Copy each uploaded file to dist/public/images
        files.forEach(file => {
            const src = path.resolve(process.cwd(), 'public', 'images', file.filename);
            const dest = path.resolve(process.cwd(), 'dist', 'public', 'images', file.filename);
            
            console.log('File paths:', {
                src: src,
                dest: dest,
                srcExists: fs.existsSync(src),
                destDirExists: fs.existsSync(path.dirname(dest))
            });

            // Ensure the destination directory exists
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            
            // Copy the file
            fs.copyFileSync(src, dest);
            console.log(`Successfully copied file from ${src} to ${dest}`);
        });

        const response = {
            message: 'Files uploaded successfully',
            files: files.map(file => ({
                filename: file.filename,
                path: `/images/${file.filename}`
            }))
        };
        console.log('Sending success response:', response);
        res.json(response);
    } catch (error) {
        console.error('Error in upload handler:', error);
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
        }
        res.status(500).json({ 
            error: 'Failed to process uploaded files',
            details: error instanceof Error ? error.message : String(error)
        });
    }
} 