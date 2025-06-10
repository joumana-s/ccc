import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export async function resizeHandler(req: Request, res: Response) {
    try {
        const { filename, width, height } = req.body;
        if (!filename || !width || !height) {
            return res.status(400).json({ error: 'Missing filename, width, or height' });
        }
        const originalPath = path.join(__dirname, '../../public/images', filename);
        const resizedFilename = `resized-${width}x${height}-${filename}`;
        const resizedPath = path.join(__dirname, '../../public/images/resized', resizedFilename);
        if (!fs.existsSync(originalPath)) {
            return res.status(404).json({ error: 'Original image not found' });
        }
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
}

export async function apiResizeHandler(req: Request, res: Response) {
    try {
        const { src, width, height } = req.query;
        if (!src || !width || !height) {
            return res.status(400).json({ error: 'Missing required parameters: src, width, height' });
        }
        const filename = src.toString().replace('/images/', '');
        const originalPath = path.join(__dirname, '../../public/images', filename);
        if (!fs.existsSync(originalPath)) {
            return res.status(404).json({ error: 'Original image not found' });
        }
        const w = parseInt(width.toString());
        const h = parseInt(height.toString());
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0 || w > 2000 || h > 2000) {
            return res.status(400).json({ error: 'Invalid dimensions. Width and height must be between 1 and 2000' });
        }
        const cacheFilename = `cache-${w}x${h}-${filename}`;
        const cachePath = path.join(__dirname, '../../public/images/resized', cacheFilename);
        if (fs.existsSync(cachePath)) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            return res.sendFile(cachePath);
        }
        const resizedDir = path.join(__dirname, '../../public/images/resized');
        if (!fs.existsSync(resizedDir)) {
            fs.mkdirSync(resizedDir, { recursive: true });
        }
        await sharp(originalPath)
            .resize(w, h)
            .jpeg({ quality: 85 })
            .toFile(cachePath);
        console.log(`Dynamically resized and cached: ${filename} to ${w}x${h}`);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.sendFile(cachePath);
    } catch (error) {
        console.error('Dynamic resize error:', error);
        res.status(500).json({ error: 'Failed to resize image' });
    }
} 