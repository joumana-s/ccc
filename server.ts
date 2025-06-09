import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const app = express();
const PORT = 3000;

// Parse JSON bodies
app.use(express.json());

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'public', 'images');
const resizedDir = path.join(__dirname, 'public', 'images', 'resized');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(resizedDir)) {
    fs.mkdirSync(resizedDir, { recursive: true });
}

// Serve static files from /public and its subdirectories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/dist', express.static(path.join(__dirname, 'public', 'dist')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        cb(null, 'public/images/');
    },
    filename: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed!'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload endpoint
app.post('/upload', upload.array('images', 10), (req: Request, res: Response) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const files = req.files as Express.Multer.File[];
    console.log(`Uploaded ${files.length} files:`, files.map(f => f.filename));
    
    res.json({
        message: 'Files uploaded successfully',
        files: files.map(file => ({
            filename: file.filename,
            path: `/images/${file.filename}`
        }))
    });
});

// Resize endpoint
app.post('/resize', async (req: Request, res: Response) => {
    try {
        const { filename, width, height } = req.body;
        
        if (!filename || !width || !height) {
            return res.status(400).json({ error: 'Missing filename, width, or height' });
        }
        
        const originalPath = path.join(__dirname, 'public', 'images', filename);
        const resizedFilename = `resized-${width}x${height}-${filename}`;
        const resizedPath = path.join(__dirname, 'public', 'images', 'resized', resizedFilename);
        
        // Check if original file exists
        if (!fs.existsSync(originalPath)) {
            return res.status(404).json({ error: 'Original image not found' });
        }
        
        // Resize the image using Sharp
        await sharp(originalPath)
            .resize(parseInt(width), parseInt(height))
            .toFile(resizedPath);
        
        console.log(`Resized ${filename} to ${width}x${height}`);
        
        res.json({
            message: 'Image resized successfully',
            filename: resizedFilename,
            resizedPath: `/images/resized/${resizedFilename}`,
            dimensions: { width: parseInt(width), height: parseInt(height) }
        });
        
    } catch (error) {
        console.error('Resize error:', error);
        res.status(500).json({ error: 'Failed to resize image' });
    }
});

// Serve index.html at root
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
        }
    }
    res.status(500).json({ error: error.message });
});

app.get('/api/resize-image', async (req: Request, res: Response) => {
    try {
        const { src, width, height } = req.query;
        
        if (!src || !width || !height) {
            return res.status(400).json({ 
                error: 'Missing required parameters: src, width, height' 
            });
        }
        
        // Extract filename from src (remove /images/ prefix)
        const filename = src.toString().replace('/images/', '');
        const originalPath = path.join(__dirname, 'public', 'images', filename);
        
        // Check if original file exists
        if (!fs.existsSync(originalPath)) {
            return res.status(404).json({ error: 'Original image not found' });
        }
        
        // Validate dimensions
        const w = parseInt(width.toString());
        const h = parseInt(height.toString());
        
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0 || w > 2000 || h > 2000) {
            return res.status(400).json({ 
                error: 'Invalid dimensions. Width and height must be between 1 and 2000' 
            });
        }
        
        // Create a cache-friendly filename
        const cacheFilename = `cache-${w}x${h}-${filename}`;
        const cachePath = path.join(__dirname, 'public', 'images', 'resized', cacheFilename);
        
        // Check if cached version exists
        if (fs.existsSync(cachePath)) {
            // Serve cached image
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
            return res.sendFile(cachePath);
        }
        
        // Create resized directory if it doesn't exist
        const resizedDir = path.join(__dirname, 'public', 'images', 'resized');
        if (!fs.existsSync(resizedDir)) {
            fs.mkdirSync(resizedDir, { recursive: true });
        }
        
        // Resize and cache the image
        await sharp(originalPath)
            .resize(w, h)
            .jpeg({ quality: 85 }) // Optimize quality
            .toFile(cachePath);
        
        console.log(`Dynamically resized and cached: ${filename} to ${w}x${h}`);
        
        // Serve the newly created image
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.sendFile(cachePath);
        
    } catch (error) {
        console.error('Dynamic resize error:', error);
        res.status(500).json({ error: 'Failed to resize image' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 