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
const mocks_1 = require("../helpers/mocks");
const mocks_2 = require("../helpers/mocks");
const path = __importStar(require("path"));
const proxyquire = require('proxyquire');
describe('apiResizeHandler', () => {
    let req;
    let res;
    let mockResponse;
    let mockFs;
    let mockSharp;
    let apiResizeHandler;
    beforeAll(() => {
        // Create sharp mock
        mockSharp = (0, mocks_2.createMockSharp)();
        // Mock 'sharp' module using proxyquire before importing controller
        const controller = proxyquire('../../server/controllers/resizeController', {
            sharp: mockSharp,
        });
        apiResizeHandler = controller.apiResizeHandler;
    });
    afterAll(() => {
        // No need to restore sharp as proxyquire mocks only for this import
    });
    beforeEach(() => {
        mockResponse = (0, mocks_1.createMockResponse)();
        res = mockResponse.res;
        // Create fresh mocks for each test
        mockFs = (0, mocks_1.createMockFs)();
        // Reset sharp mock calls
        mockSharp.calls.reset();
        mockSharp.instance.resize.calls.reset();
        mockSharp.instance.jpeg.calls.reset();
        mockSharp.instance.toFile.calls.reset();
        // Set up mock modules
        const fs = require('fs');
        spyOn(fs, 'existsSync').and.callFake(mockFs.existsSync);
        spyOn(fs, 'mkdirSync').and.callFake(mockFs.mkdirSync);
        spyOn(fs, 'copyFileSync').and.callFake(mockFs.copyFileSync);
        // Set up default mock behavior
        mockFs.existsSync.and.returnValue(true);
    });
    afterEach(() => {
        // Reset spies on fs methods
        const fs = require('fs');
        fs.existsSync.calls.reset();
        fs.mkdirSync.calls.reset();
        fs.copyFileSync.calls.reset();
    });
    it('should return 400 if required query parameters are missing', async () => {
        const testCases = [
            { query: { width: '100', height: '100' }, missing: 'src' },
            { query: { src: '/images/test.jpg', height: '100' }, missing: 'width' },
            { query: { src: '/images/test.jpg', width: '100' }, missing: 'height' },
            { query: {}, missing: 'all parameters' },
        ];
        for (const testCase of testCases) {
            req = { query: testCase.query };
            await apiResizeHandler(req, res);
            expect(mockResponse.statusSpy).toHaveBeenCalledWith(400);
            expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
                error: 'Missing required parameters: src, width, height',
            });
            mockResponse.statusSpy.calls.reset();
            mockResponse.jsonSpy.calls.reset();
        }
    });
    it('should serve cached image if available', async () => {
        req = {
            query: {
                src: '/images/test.jpg',
                width: '100',
                height: '100',
            },
        };
        const expectedOriginalPath = path.join(process.cwd(), 'public/images/test.jpg');
        const expectedResizedPath = path.join(process.cwd(), 'public/images/resized/resized-100x100-test.jpg');
        // Both original and cache exist
        mockFs.existsSync.and.callFake((path) => {
            return path === expectedOriginalPath || path === expectedResizedPath;
        });
        await apiResizeHandler(req, res);
        expect(mockResponse.setHeaderSpy).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
        expect(mockResponse.setHeaderSpy).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000');
        expect(mockResponse.sendFileSpy).toHaveBeenCalledWith(expectedResizedPath);
        expect(mockSharp).not.toHaveBeenCalled();
    });
    it('should create and serve new resized image if cache missing', async () => {
        req = {
            query: {
                src: '/images/test.jpg',
                width: '100',
                height: '100',
            },
        };
        // Original exists but cache doesn't
        mockFs.existsSync.and.callFake((path) => {
            return !path.includes('resized');
        });
        const expectedOriginalPath = path.join(process.cwd(), 'public/images/test.jpg');
        const expectedResizedPath = path.join(process.cwd(), 'public/images/resized/resized-100x100-test.jpg');
        await apiResizeHandler(req, res);
        expect(mockSharp).toHaveBeenCalledWith(expectedOriginalPath);
        expect(mockSharp.instance.resize).toHaveBeenCalledWith(100, 100);
        expect(mockSharp.instance.jpeg).toHaveBeenCalledWith({ quality: 85 });
        expect(mockSharp.instance.toFile).toHaveBeenCalledWith(expectedResizedPath);
        expect(mockResponse.setHeaderSpy).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
        expect(mockResponse.setHeaderSpy).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000');
        expect(mockResponse.sendFileSpy).toHaveBeenCalledWith(expectedResizedPath);
    });
    it('should create resized directory if it does not exist', async () => {
        req = {
            query: {
                src: '/images/test.jpg',
                width: '100',
                height: '100',
            },
        };
        mockFs.existsSync.and.callFake((path) => {
            return !path.includes('resized');
        });
        await apiResizeHandler(req, res);
        expect(mockFs.mkdirSync).toHaveBeenCalled();
    });
    it('should handle file system errors during directory creation', async () => {
        req = {
            query: {
                src: '/images/test.jpg',
                width: '100',
                height: '100',
            },
        };
        mockFs.existsSync.and.callFake((path) => {
            return !path.includes('resized');
        });
        mockFs.mkdirSync.and.throwError('Failed to create directory');
        await apiResizeHandler(req, res);
        expect(mockResponse.statusSpy).toHaveBeenCalledWith(500);
        expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
            error: 'Failed to create resized directory',
        });
    });
});
