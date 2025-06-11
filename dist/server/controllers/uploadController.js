"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadHandler = uploadHandler;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function uploadHandler(req, res) {
    // console.log('Upload handler called');
    // console.log('Request files:', req.files);
    // console.log('Request body:', req.body);
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        console.error('No files in request or invalid files array');
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const files = req.files;
    // console.log(`Processing ${files.length} files:`, files.map(f => ({
    //     filename: f.filename,
    //     originalname: f.originalname,
    //     size: f.size,
    //     mimetype: f.mimetype
    // })));
    try {
        // Copy each uploaded file to dist/public/images
        files.forEach((file) => {
            const src = path_1.default.resolve(process.cwd(), 'public', 'images', file.filename);
            const dest = path_1.default.resolve(process.cwd(), 'dist', 'public', 'images', file.filename);
            // console.log('File paths:', {
            //     src: src,
            //     dest: dest,
            //     srcExists: fs.existsSync(src),
            //     destDirExists: fs.existsSync(path.dirname(dest))
            // });
            // Ensure the destination directory exists
            fs_1.default.mkdirSync(path_1.default.dirname(dest), { recursive: true });
            // Copy the file
            fs_1.default.copyFileSync(src, dest);
            // console.log(`Successfully copied file from ${src} to ${dest}`);
        });
        const response = {
            message: 'Files uploaded successfully',
            files: files.map((file) => ({
                filename: file.filename,
                path: `/images/${file.filename}`,
            })),
        };
        // console.log('Sending success response:', response);
        res.json(response);
    }
    catch (error) {
        console.error('Error in upload handler:', error);
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
        }
        res.status(500).json({
            error: 'Failed to process uploaded files',
        });
    }
}
