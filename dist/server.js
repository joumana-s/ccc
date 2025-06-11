'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
const multer_1 = __importDefault(require('multer'));
const path_1 = __importDefault(require('path'));
const fs_1 = __importDefault(require('fs'));
const sharp_1 = __importDefault(require('sharp'));
const app = (0, express_1.default)();
const PORT = 3000;
// Parse JSON bodies
app.use(express_1.default.json());
// Create images directory if it doesn't exist
const imagesDir = path_1.default.join(__dirname, 'public', 'images');
const resizedDir = path_1.default.join(
  __dirname,
  'public',
  'images',
  'resized'
);
if (!fs_1.default.existsSync(imagesDir)) {
  fs_1.default.mkdirSync(imagesDir, { recursive: true });
}
if (!fs_1.default.existsSync(resizedDir)) {
  fs_1.default.mkdirSync(resizedDir, { recursive: true });
}
// Serve static files from /public and its subdirectories
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(
  '/images',
  express_1.default.static(path_1.default.join(__dirname, 'public', 'images'))
);
app.use(
  '/dist',
  express_1.default.static(path_1.default.join(__dirname, 'public', 'dist'))
);
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/');
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path_1.default.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = (0, multer_1.default)({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
// Upload endpoint
app.post('/upload', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  const files = req.files;
  console.log(
    `Uploaded ${files.length} files:`,
    files.map((f) => f.filename)
  );
  // Copy each uploaded file to dist/public/images
  files.forEach((file) => {
    const src = path_1.default.join('public/images', file.filename);
    const dest = path_1.default.join('dist/public/images', file.filename);
    fs_1.default.mkdirSync(path_1.default.dirname(dest), { recursive: true });
    fs_1.default.copyFileSync(src, dest);
  });
  res.json({
    message: 'Files uploaded successfully',
    files: files.map((file) => ({
      filename: file.filename,
      path: `/images/${file.filename}`,
    })),
  });
});
// Resize endpoint
app.post('/resize', async (req, res) => {
  try {
    const { filename, width, height } = req.body;
    if (!filename || !width || !height) {
      return res
        .status(400)
        .json({ error: 'Missing filename, width, or height' });
    }
    const originalPath = path_1.default.join(
      __dirname,
      'public',
      'images',
      filename
    );
    const resizedFilename = `resized-${width}x${height}-${filename}`;
    const resizedPath = path_1.default.join(
      __dirname,
      'public',
      'images',
      'resized',
      resizedFilename
    );
    // Check if original file exists
    if (!fs_1.default.existsSync(originalPath)) {
      return res.status(404).json({ error: 'Original image not found' });
    }
    // Resize the image using Sharp
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
  } catch (error) {
    console.error('Resize error:', error);
    res.status(500).json({ error: 'Failed to resize image' });
  }
});
// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer_1.default.MulterError) {
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
  }
  res.status(500).json({ error: error.message });
});
app.get('/api/resize-image', async (req, res) => {
  try {
    const { src, width, height } = req.query;
    if (!src || !width || !height) {
      return res.status(400).json({
        error: 'Missing required parameters: src, width, height',
      });
    }
    // Extract filename from src (remove /images/ prefix)
    const filename = src.toString().replace('/images/', '');
    const originalPath = path_1.default.join(
      __dirname,
      'public',
      'images',
      filename
    );
    // Check if original file exists
    if (!fs_1.default.existsSync(originalPath)) {
      return res.status(404).json({ error: 'Original image not found' });
    }
    // Validate dimensions
    const w = parseInt(width.toString());
    const h = parseInt(height.toString());
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0 || w > 2000 || h > 2000) {
      return res.status(400).json({
        error:
          'Invalid dimensions. Width and height must be between 1 and 2000',
      });
    }
    // Create a cache-friendly filename
    const cacheFilename = `cache-${w}x${h}-${filename}`;
    const cachePath = path_1.default.join(
      __dirname,
      'public',
      'images',
      'resized',
      cacheFilename
    );
    // Check if cached version exists
    if (fs_1.default.existsSync(cachePath)) {
      // Serve cached image
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      return res.sendFile(cachePath);
    }
    // Create resized directory if it doesn't exist
    const resizedDir = path_1.default.join(
      __dirname,
      'public',
      'images',
      'resized'
    );
    if (!fs_1.default.existsSync(resizedDir)) {
      fs_1.default.mkdirSync(resizedDir, { recursive: true });
    }
    // Resize and cache the image
    await (0, sharp_1.default)(originalPath)
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
