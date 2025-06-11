'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.handleUpload = handleUpload;
exports.handleResize = handleResize;
exports.handleDynamicResize = handleDynamicResize;
const path_1 = __importDefault(require('path'));
const fs_1 = __importDefault(require('fs'));
const sharp_1 = __importDefault(require('sharp'));
const utils_1 = require('./utils');
function handleUpload(files, res) {
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  files.forEach((file) => {
    const src = path_1.default.join('public/images', file.filename);
    const dest = path_1.default.join('dist/public/images', file.filename);
    (0, utils_1.copyFileToDist)(src, dest);
  });
  res.json({
    message: 'Files uploaded successfully',
    files: files.map((file) => ({
      filename: file.filename,
      path: `/images/${file.filename}`,
    })),
  });
}
async function handleResize(req, res) {
  try {
    const { filename, width, height } = req.body;
    if (!filename || !width || !height) {
      return res
        .status(400)
        .json({ error: 'Missing filename, width, or height' });
    }
    const paths = (0, utils_1.getImagePaths)(filename);
    if (!fs_1.default.existsSync(paths.original)) {
      return res.status(404).json({ error: 'Original image not found' });
    }
    await (0, sharp_1.default)(paths.original)
      .resize(parseInt(width), parseInt(height))
      .toFile(paths.resized(width, height));
    // Copy resized image to dist/public/images/resized
    const src = paths.resized(width, height);
    const dest = path_1.default.join(
      'dist/public/images/resized',
      path_1.default.basename(src)
    );
    (0, utils_1.copyFileToDist)(src, dest);
    res.json({
      message: 'Image resized successfully',
      filename: path_1.default.basename(paths.resized(width, height)),
      resizedPath: `/images/resized/${path_1.default.basename(paths.resized(width, height))}`,
      dimensions: { width: parseInt(width), height: parseInt(height) },
    });
  } catch (error) {
    console.error('Resize error:', error);
    res.status(500).json({ error: 'Failed to resize image' });
  }
}
async function handleDynamicResize(req, res) {
  try {
    const { src, width, height } = req.query;
    if (!src || !width || !height) {
      return res
        .status(400)
        .json({ error: 'Missing required parameters: src, width, height' });
    }
    const filename = src.toString().replace('/images/', '');
    const paths = (0, utils_1.getImagePaths)(filename);
    if (!fs_1.default.existsSync(paths.original)) {
      return res.status(404).json({ error: 'Original image not found' });
    }
    const w = parseInt(width.toString());
    const h = parseInt(height.toString());
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0 || w > 2000 || h > 2000) {
      return res
        .status(400)
        .json({
          error:
            'Invalid dimensions. Width and height must be between 1 and 2000',
        });
    }
    const cachePath = paths.cache(w, h);
    if (fs_1.default.existsSync(cachePath)) {
      // Copy cached image to dist/public/images/resized if not already there
      const dest = path_1.default.join(
        'dist/public/images/resized',
        path_1.default.basename(cachePath)
      );
      if (!fs_1.default.existsSync(dest)) {
        (0, utils_1.copyFileToDist)(cachePath, dest);
      }
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.sendFile(dest);
    }
    (0, utils_1.ensureDirExists)(path_1.default.dirname(cachePath));
    await (0, sharp_1.default)(paths.original)
      .resize(w, h)
      .jpeg({ quality: 85 })
      .toFile(cachePath);
    // Copy new cached image to dist/public/images/resized
    const dest = path_1.default.join(
      'dist/public/images/resized',
      path_1.default.basename(cachePath)
    );
    (0, utils_1.copyFileToDist)(cachePath, dest);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(dest);
  } catch (error) {
    console.error('Dynamic resize error:', error);
    res.status(500).json({ error: 'Failed to resize image' });
  }
}
