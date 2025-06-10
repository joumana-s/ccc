"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resizeHandler = resizeHandler;
exports.apiResizeHandler = apiResizeHandler;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
async function resizeHandler(req, res) {
    try {
        const { filename, width, height } = req.body;
        if (!filename || !width || !height) {
            return res.status(400).json({ error: 'Missing filename, width, or height' });
        }
        const originalPath = path_1.default.join(__dirname, '../../public/images', filename);
        const resizedFilename = `resized-${width}x${height}-${filename}`;
        const resizedPath = path_1.default.join(__dirname, '../../public/images/resized', resizedFilename);
        if (!fs_1.default.existsSync(originalPath)) {
            return res.status(404).json({ error: 'Original image not found' });
        }
        await (0, sharp_1.default)(originalPath)
            .resize(parseInt(width), parseInt(height))
            .toFile(resizedPath);
        console.log(`Resized ${filename} to ${width}x${height}`);
        res.json({
            message: 'Image resized successfully',
            filename: resizedFilename,
            resizedPath: `/images/resized/${resizedFilename}`,
            dimensions: { width: parseInt(width), height: parseInt(height) }
        });
    }
    catch (error) {
        console.error('Resize error:', error);
        res.status(500).json({ error: 'Failed to resize image' });
    }
}
async function apiResizeHandler(req, res) {
    try {
        const { src, width, height } = req.query;
        if (!src || !width || !height) {
            return res.status(400).json({ error: 'Missing required parameters: src, width, height' });
        }
        const filename = src.toString().replace('/images/', '');
        const originalPath = path_1.default.join(__dirname, '../../public/images', filename);
        if (!fs_1.default.existsSync(originalPath)) {
            return res.status(404).json({ error: 'Original image not found' });
        }
        const w = parseInt(width.toString());
        const h = parseInt(height.toString());
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0 || w > 2000 || h > 2000) {
            return res.status(400).json({ error: 'Invalid dimensions. Width and height must be between 1 and 2000' });
        }
        const cacheFilename = `cache-${w}x${h}-${filename}`;
        const cachePath = path_1.default.join(__dirname, '../../public/images/resized', cacheFilename);
        if (fs_1.default.existsSync(cachePath)) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            return res.sendFile(cachePath);
        }
        const resizedDir = path_1.default.join(__dirname, '../../public/images/resized');
        if (!fs_1.default.existsSync(resizedDir)) {
            fs_1.default.mkdirSync(resizedDir, { recursive: true });
        }
        await (0, sharp_1.default)(originalPath)
            .resize(w, h)
            .jpeg({ quality: 85 })
            .toFile(cachePath);
        console.log(`Dynamically resized and cached: ${filename} to ${w}x${h}`);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.sendFile(cachePath);
    }
    catch (error) {
        console.error('Dynamic resize error:', error);
        res.status(500).json({ error: 'Failed to resize image' });
    }
}
