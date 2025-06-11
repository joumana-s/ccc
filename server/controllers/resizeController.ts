import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const validateDimensions = (width: string, height: string): boolean => {
  const w: number = parseInt(width);
  const h: number = parseInt(height);
  return !isNaN(w) && !isNaN(h) && w > 0 && h > 0;
};

const ensureResizedDirectory = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (error) {
      throw new Error('Failed to create resized directory');
    }
  }
};

export async function resizeHandler(req: Request, res: Response): Promise<void> {
  try {
    const { filename, width, height } = req.body;

    // Validate required parameters
    if (!filename || !width || !height) {
      res.status(400).json({ error: 'Missing filename, width, or height' });
      return;
    }

    // Validate dimensions
    if (!validateDimensions(width, height)) {
      res.status(400).json({
        error: 'Invalid dimensions. Width and height must be positive numbers.',
      });
      return;
    }

    const originalPath: string = path.join(process.cwd(), 'public/images', filename);
    const resizedFilename: string = `resized-${width}x${height}-${filename}`;
    const resizedDir: string = path.join(process.cwd(), 'public/images/resized');
    const resizedPath: string = path.join(resizedDir, resizedFilename);

    // Check if original file exists
    if (!fs.existsSync(originalPath)) {
      res.status(404).json({ error: 'Original image not found' });
      return;
    }

    // Ensure resized directory exists
    try {
      ensureResizedDirectory(resizedDir);
    } catch (error) {
      console.error('Directory creation error:', error);
      res.status(500).json({ error: 'Failed to create resized directory' });
      return;
    }

    // Resize image
    await sharp(originalPath)
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
}

export async function apiResizeHandler(req: Request, res: Response): Promise<void> {
  try {
    const { src, width, height } = req.query;

    // Validate required parameters
    if (!src || !width || !height) {
      res.status(400).json({
        error: 'Missing required parameters: src, width, height',
      });
      return;
    }

    // Validate dimensions
    if (!validateDimensions(width as string, height as string)) {
      res.status(400).json({
        error: 'Invalid dimensions. Width and height must be positive numbers.',
      });
      return;
    }

    const filename: string = path.basename(src as string);
    const originalPath: string = path.join(process.cwd(), 'public/images', filename);
    const resizedFilename: string = `resized-${width}x${height}-${filename}`;
    const resizedDir: string = path.join(process.cwd(), 'public/images/resized');
    const resizedPath: string = path.join(resizedDir, resizedFilename);

    // Check if original file exists
    if (!fs.existsSync(originalPath)) {
      res.status(404).json({ error: 'Original image not found' });
      return;
    }

    // Check if resized version exists
    if (fs.existsSync(resizedPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.sendFile(resizedPath);
      return;
    }

    // Ensure resized directory exists
    try {
      ensureResizedDirectory(resizedDir);
    } catch (error) {
      console.error('Directory creation error:', error);
      res.status(500).json({ error: 'Failed to create resized directory' });
      return;
    }

    // Create resized version
    await sharp(originalPath)
      .resize(parseInt(width as string), parseInt(height as string))
      .jpeg({ quality: 85 })
      .toFile(resizedPath);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(resizedPath);
  } catch (error) {
    console.error('API resize error:', error);
    res.status(500).json({ error: 'Failed to resize image' });
  }
}
