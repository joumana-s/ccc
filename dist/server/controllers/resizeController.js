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
const validateDimensions = (width, height) => {
    const w = parseInt(width);
    const h = parseInt(height);
    return !isNaN(w) && !isNaN(h) && w > 0 && h > 0;
};
const ensureResizedDirectory = (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        try {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
        catch (error) {
            throw new Error('Failed to create resized directory');
        }
    }
};
async function resizeHandler(req, res) {
    try {
        const { filename, width, height } = req.body;
        // Validate required parameters
        if (!filename || !width || !height) {
            return res
                .status(400)
                .json({ error: 'Missing filename, width, or height' });
        }
        // Validate dimensions
        if (!validateDimensions(width, height)) {
            return res.status(400).json({
                error: 'Invalid dimensions. Width and height must be positive numbers.',
            });
        }
        const originalPath = path_1.default.join(process.cwd(), 'public/images', filename);
        const resizedFilename = `resized-${width}x${height}-${filename}`;
        const resizedDir = path_1.default.join(process.cwd(), 'public/images/resized');
        const resizedPath = path_1.default.join(resizedDir, resizedFilename);
        // Check if original file exists
        if (!fs_1.default.existsSync(originalPath)) {
            return res.status(404).json({ error: 'Original image not found' });
        }
        // Ensure resized directory exists
        try {
            ensureResizedDirectory(resizedDir);
        }
        catch (error) {
            console.error('Directory creation error:', error);
            return res
                .status(500)
                .json({ error: 'Failed to create resized directory' });
        }
        // Resize image
        await (0, sharp_1.default)(originalPath)
            .resize(parseInt(width), parseInt(height))
            .toFile(resizedPath);
        console.log(`Resized ${filename} to ${width}x${height}`);
        res.json({
            message: 'Image resized successfully',
            filename: resizedFilename,
            resizedPath: `/images/resized/${resizedFilename}`,
            dimensions: { width: parseInt(width), height: parseInt(height) },
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
        // Validate required parameters
        if (!src || !width || !height) {
            return res.status(400).json({
                error: 'Missing required parameters: src, width, height',
            });
        }
        // Validate dimensions
        if (!validateDimensions(width, height)) {
            return res.status(400).json({
                error: 'Invalid dimensions. Width and height must be positive numbers.',
            });
        }
        const filename = path_1.default.basename(src);
        const originalPath = path_1.default.join(process.cwd(), 'public/images', filename);
        const resizedFilename = `resized-${width}x${height}-${filename}`;
        const resizedDir = path_1.default.join(process.cwd(), 'public/images/resized');
        const resizedPath = path_1.default.join(resizedDir, resizedFilename);
        // Check if original file exists
        if (!fs_1.default.existsSync(originalPath)) {
            return res.status(404).json({ error: 'Original image not found' });
        }
        // Check if resized version exists
        if (fs_1.default.existsSync(resizedPath)) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            return res.sendFile(resizedPath);
        }
        // Ensure resized directory exists
        try {
            ensureResizedDirectory(resizedDir);
        }
        catch (error) {
            console.error('Directory creation error:', error);
            return res
                .status(500)
                .json({ error: 'Failed to create resized directory' });
        }
        // Create resized version
        await (0, sharp_1.default)(originalPath)
            .resize(parseInt(width), parseInt(height))
            .jpeg({ quality: 85 })
            .toFile(resizedPath);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.sendFile(resizedPath);
    }
    catch (error) {
        console.error('API resize error:', error);
        res.status(500).json({ error: 'Failed to resize image' });
    }
}
