"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const upload_1 = __importDefault(require("./routes/upload"));
const resize_1 = __importDefault(require("./routes/resize"));
const app = (0, express_1.default)();
// Parse JSON bodies
app.use(express_1.default.json());
// Create images directory if it doesn't exist
const imagesDir = path_1.default.resolve(process.cwd(), 'public', 'images');
const resizedDir = path_1.default.join(imagesDir, 'resized');
if (!fs_1.default.existsSync(imagesDir)) {
    fs_1.default.mkdirSync(imagesDir, { recursive: true });
    console.log('Created images directory:', imagesDir);
}
if (!fs_1.default.existsSync(resizedDir)) {
    fs_1.default.mkdirSync(resizedDir, { recursive: true });
    console.log('Created resized directory:', resizedDir);
}
// Serve static files from /public and its subdirectories
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use('/images', express_1.default.static(path_1.default.join(__dirname, '../public/images')));
app.use('/dist', express_1.default.static(path_1.default.join(__dirname, '../public/dist')));
// Routes
app.use(upload_1.default);
app.use(resize_1.default);
// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
    });
    if (error instanceof multer_1.default.MulterError) {
        console.error('Multer error:', error.code);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res
                .status(400)
                .json({ error: 'File too large. Maximum size is 5MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res
                .status(400)
                .json({ error: 'Too many files. Maximum is 10 files.' });
        }
        return res.status(400).json({ error: `Upload error: ${error.message}` });
    }
    res.status(500).json({
        error: 'Internal server error',
        details: error.message,
        type: error.name,
    });
});
exports.default = app;
