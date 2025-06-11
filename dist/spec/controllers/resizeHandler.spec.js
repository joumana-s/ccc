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
describe('resizeHandler', () => {
    let req;
    let res;
    let mockResponse;
    let mockFs;
    let mockSharp;
    let resizeHandler;
    beforeAll(() => {
        // Create sharp mock
        mockSharp = (0, mocks_2.createMockSharp)();
        // Mock 'sharp' module using proxyquire before importing controller
        const controller = proxyquire('../../server/controllers/resizeController', {
            sharp: mockSharp,
        });
        resizeHandler = controller.resizeHandler;
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
    it('should return 400 if required parameters are missing', async () => {
        const testCases = [
            { body: { width: '100', height: '100' }, missing: 'filename' },
            { body: { filename: 'test.jpg', height: '100' }, missing: 'width' },
            { body: { filename: 'test.jpg', width: '100' }, missing: 'height' },
            { body: {}, missing: 'all parameters' },
        ];
        for (const testCase of testCases) {
            req = { body: testCase.body };
            await resizeHandler(req, res);
            expect(mockResponse.statusSpy).toHaveBeenCalledWith(400);
            expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
                error: 'Missing filename, width, or height',
            });
            mockResponse.statusSpy.calls.reset();
            mockResponse.jsonSpy.calls.reset();
        }
    });
    it('should return 404 if original image does not exist', async () => {
        req = {
            body: {
                filename: 'nonexistent.jpg',
                width: '100',
                height: '100',
            },
        };
        mockFs.existsSync.and.returnValue(false);
        await resizeHandler(req, res);
        expect(mockResponse.statusSpy).toHaveBeenCalledWith(404);
        expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
            error: 'Original image not found',
        });
        expect(mockSharp).not.toHaveBeenCalled();
    });
    it('should successfully resize an image', async () => {
        const filename = 'test.jpg';
        const width = '100';
        const height = '100';
        req = {
            body: { filename, width, height },
        };
        mockFs.existsSync.and.returnValue(true);
        const expectedOriginalPath = path.join(process.cwd(), 'public/images', filename);
        const expectedResizedPath = path.join(process.cwd(), 'public/images/resized', `resized-${width}x${height}-${filename}`);
        await resizeHandler(req, res);
        expect(mockSharp).toHaveBeenCalledWith(expectedOriginalPath);
        expect(mockSharp.instance.resize).toHaveBeenCalledWith(100, 100);
        expect(mockSharp.instance.toFile).toHaveBeenCalledWith(expectedResizedPath);
        expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
            message: 'Image resized successfully',
            filename: `resized-${width}x${height}-${filename}`,
            resizedPath: `/images/resized/resized-${width}x${height}-${filename}`,
            dimensions: { width: 100, height: 100 },
        });
    });
    it('should handle sharp processing errors', async () => {
        const error = new Error('Sharp processing failed');
        const failingSharp = (0, mocks_2.createFailingMockSharp)(error);
        // Import controller with failingSharp mock using proxyquire
        const controllerWithFailingSharp = proxyquire('../../server/controllers/resizeController', {
            sharp: failingSharp,
        });
        const resizeHandlerWithFailingSharp = controllerWithFailingSharp.resizeHandler;
        req = {
            body: {
                filename: 'test.jpg',
                width: '100',
                height: '100',
            },
        };
        mockFs.existsSync.and.returnValue(true);
        await resizeHandlerWithFailingSharp(req, res);
        const expectedOriginalPath = path.join(process.cwd(), 'public/images', 'test.jpg');
        expect(failingSharp).toHaveBeenCalledWith(expectedOriginalPath);
        expect(failingSharp.instance.resize).toHaveBeenCalledWith(100, 100);
        expect(failingSharp.instance.toFile).toHaveBeenCalled();
        expect(mockResponse.statusSpy).toHaveBeenCalledWith(500);
        expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
            error: 'Failed to resize image',
        });
    });
    it('should handle invalid dimensions', async () => {
        const testCases = [
            { width: '0', height: '100' },
            { width: '-100', height: '100' },
            { width: 'abc', height: '100' },
            { width: '100', height: '0' },
            { width: '100', height: '-100' },
            { width: '100', height: 'abc' },
        ];
        for (const { width, height } of testCases) {
            req = {
                body: {
                    filename: 'test.jpg',
                    width,
                    height,
                },
            };
            mockFs.existsSync.and.returnValue(true);
            await resizeHandler(req, res);
            expect(mockResponse.statusSpy).toHaveBeenCalledWith(400);
            expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
                error: 'Invalid dimensions. Width and height must be positive numbers.',
            });
            mockResponse.statusSpy.calls.reset();
            mockResponse.jsonSpy.calls.reset();
        }
    });
});
