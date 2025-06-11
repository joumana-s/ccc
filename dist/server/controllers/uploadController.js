"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadHandler = uploadHandler;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function uploadHandler(req, res) {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const files = req.files;
    try {
        // Copy each uploaded file to dist/public/images
        files.forEach(file => {
            const src = path_1.default.resolve(process.cwd(), 'public', 'images', file.filename);
            const dest = path_1.default.resolve(process.cwd(), 'dist', 'public', 'images', file.filename);
            // Ensure the destination directory exists
            fs_1.default.mkdirSync(path_1.default.dirname(dest), { recursive: true });
            // Copy the file
            fs_1.default.copyFileSync(src, dest);
        });
        res.json({
            message: 'Files uploaded successfully',
            files: files.map(file => ({
                filename: file.filename,
                path: `/images/${file.filename}`
            }))
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to process uploaded files'
        });
    }
}
