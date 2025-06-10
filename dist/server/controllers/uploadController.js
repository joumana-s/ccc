"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadHandler = uploadHandler;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function uploadHandler(req, res) {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const files = req.files;
    console.log(`Uploaded ${files.length} files:`, files.map(f => f.filename));
    // Copy each uploaded file to dist/public/images
    files.forEach(file => {
        const src = path_1.default.join('public/images', file.filename);
        const dest = path_1.default.join('dist/public/images', file.filename);
        fs_1.default.mkdirSync(path_1.default.dirname(dest), { recursive: true });
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
