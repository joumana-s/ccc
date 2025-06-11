'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.ensureDirExists = ensureDirExists;
exports.copyFileToDist = copyFileToDist;
exports.getImagePaths = getImagePaths;
const path_1 = __importDefault(require('path'));
const fs_1 = __importDefault(require('fs'));
function ensureDirExists(dirPath) {
  if (!fs_1.default.existsSync(dirPath)) {
    fs_1.default.mkdirSync(dirPath, { recursive: true });
  }
}
function copyFileToDist(src, dest) {
  fs_1.default.mkdirSync(path_1.default.dirname(dest), { recursive: true });
  fs_1.default.copyFileSync(src, dest);
}
function getImagePaths(filename) {
  return {
    original: path_1.default.join(__dirname, 'public', 'images', filename),
    resized: (width, height) =>
      path_1.default.join(
        __dirname,
        'public',
        'images',
        'resized',
        `resized-${width}x${height}-${filename}`
      ),
    cache: (width, height) =>
      path_1.default.join(
        __dirname,
        'public',
        'images',
        'resized',
        `cache-${width}x${height}-${filename}`
      ),
  };
}
