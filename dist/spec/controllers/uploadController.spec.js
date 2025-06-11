"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const uploadController_1 = require("../../server/controllers/uploadController");
const path = __importStar(require("path"));
const mocks_1 = require("../helpers/mocks");
const stream_1 = require("stream");
describe('UploadController', () => {
    let req;
    let res;
    let mockResponse;
    let mockFs;
    beforeEach(() => {
        mockResponse = (0, mocks_1.createMockResponse)();
        res = mockResponse.res;
        // Create fresh mocks for each test
        mockFs = (0, mocks_1.createMockFs)();
        // Replace fs module functions with mocks
        spyOn(require('fs'), 'mkdirSync').and.callFake(mockFs.mkdirSync);
        spyOn(require('fs'), 'copyFileSync').and.callFake(mockFs.copyFileSync);
        spyOn(require('fs'), 'existsSync').and.callFake(mockFs.existsSync);
    });
    it('should return 400 if no files are uploaded', () => {
        req = {
            files: [],
        };
        (0, uploadController_1.uploadHandler)(req, res);
        expect(mockResponse.statusSpy).toHaveBeenCalledWith(400);
        expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
            error: 'No files uploaded',
        });
    });
    it('should handle successful file upload', () => {
        const mockStream = new stream_1.Readable();
        mockStream.push(null); // end the stream
        const mockFile = {
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
        (0, uploadController_1.uploadHandler)(req, res);
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
        const mockStream = new stream_1.Readable();
        mockStream.push(null); // end the stream
        const mockFile = {
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
        (0, uploadController_1.uploadHandler)(req, res);
        expect(mockResponse.statusSpy).toHaveBeenCalledWith(500);
        expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
            error: 'Failed to process uploaded files',
        });
    });
});
