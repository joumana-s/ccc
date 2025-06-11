import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import uploadRoutes from './routes/upload';
import resizeRoutes from './routes/resize';

const app = express();

// Parse JSON bodies
app.use(express.json());

// Create images directory if it doesn't exist
const imagesDir = path.resolve(process.cwd(), 'public', 'images');
const resizedDir = path.join(imagesDir, 'resized');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created images directory:', imagesDir);
}
if (!fs.existsSync(resizedDir)) {
    fs.mkdirSync(resizedDir, { recursive: true });
    console.log('Created resized directory:', resizedDir);
}

// Serve static files from /public and its subdirectories
app.use(express.static(path.join(__dirname, '../public')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/dist', express.static(path.join(__dirname, '../public/dist')));

// Routes
app.use(uploadRoutes);
app.use(resizeRoutes);

// Serve index.html at root
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
    });

    if (error instanceof multer.MulterError) {
        console.error('Multer error:', error.code);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
        }
        return res.status(400).json({ error: `Upload error: ${error.message}` });
    }

    res.status(500).json({ 
        error: 'Internal server error',
        details: error.message,
        type: error.name
    });
});

export default app; 