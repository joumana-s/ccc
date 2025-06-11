import { Request, Response } from 'express';
import { uploadHandler } from '../../server/controllers/uploadController';
import * as path from 'path';
import {
  createMockResponse,
  createMockFs,
  MockResponse,
  MockFs,
} from '../helpers/mocks';
import { Readable } from 'stream';
import { Multer } from 'multer';

// Define Multer file interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  buffer: Buffer;
  stream: Readable;
}

// Extend Request type to include files property
interface RequestWithFiles extends Request {
  files?: MulterFile[];
}

describe('UploadController', () => {
  let req: Partial<RequestWithFiles>;
  let res: Partial<Response>;
  let mockResponse: MockResponse;
  let mockFs: MockFs;

  beforeEach(() => {
    mockResponse = createMockResponse();
    res = mockResponse.res;

    // Create fresh mocks for each test
    mockFs = createMockFs();
    // Replace fs module functions with mocks
    spyOn(require('fs'), 'mkdirSync').and.callFake(mockFs.mkdirSync);
    spyOn(require('fs'), 'copyFileSync').and.callFake(mockFs.copyFileSync);
    spyOn(require('fs'), 'existsSync').and.callFake(mockFs.existsSync);
  });

  it('should return 400 if no files are uploaded', () => {
    req = {
      files: [],
    };

    uploadHandler(req as Request, res as Response);

    expect(mockResponse.statusSpy).toHaveBeenCalledWith(400);
    expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
      error: 'No files uploaded',
    });
  });

  it('should handle successful file upload', () => {
    const mockStream = new Readable();
    mockStream.push(null); // end the stream

    const mockFile: MulterFile = {
      fieldname: 'images',
      filename: 'test-image.jpg',
      originalname: 'original.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: path.join('public', 'images'),
      path: path.join('public', 'images', 'test-image.jpg'),
      size: 1024,
      buffer: Buffer.from([]),
      stream: mockStream,
    };

    req = {
      files: [mockFile],
    };

    mockFs.existsSync.and.returnValue(true);

    uploadHandler(req as Request, res as Response);

    expect(mockFs.mkdirSync).toHaveBeenCalled();
    expect(mockFs.copyFileSync).toHaveBeenCalled();
    expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
      message: 'Files uploaded successfully',
      files: [
        {
          filename: 'test-image.jpg',
          path: '/images/test-image.jpg',
        },
      ],
    });
  });

  it('should handle file system errors', () => {
    const mockStream = new Readable();
    mockStream.push(null); // end the stream

    const mockFile: MulterFile = {
      fieldname: 'images',
      filename: 'test-image.jpg',
      originalname: 'original.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: path.join('public', 'images'),
      path: path.join('public', 'images', 'test-image.jpg'),
      size: 1024,
      buffer: Buffer.from([]),
      stream: mockStream,
    };

    req = {
      files: [mockFile],
    };

    mockFs.mkdirSync.and.throwError('File system error');

    uploadHandler(req as Request, res as Response);

    expect(mockResponse.statusSpy).toHaveBeenCalledWith(500);
    expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
      error: 'Failed to process uploaded files',
    });
  });
});
