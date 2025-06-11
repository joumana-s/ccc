import {
  createMockResponse,
  createMockFs,
  MockResponse,
  MockFs,
} from '../helpers/mocks';
import { createMockSharp, SharpSpy } from '../helpers/mocks';
import * as path from 'path';

interface RequestWithQuery extends Request {
  query?: Record<string, any>;
}

const proxyquire = require('proxyquire');

describe('apiResizeHandler', () => {
  let req: Partial<RequestWithQuery>;
  let res: Response;
  let mockResponse: MockResponse;
  let mockFs: MockFs;
  let mockSharp: SharpSpy;
  let apiResizeHandler: any;

  beforeAll(() => {
    // Create sharp mock
    mockSharp = createMockSharp();

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
    mockResponse = createMockResponse();
    res = mockResponse.res as unknown as Response;

    // Create fresh mocks for each test
    mockFs = createMockFs();

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
    (fs.existsSync as jasmine.Spy).calls.reset();
    (fs.mkdirSync as jasmine.Spy).calls.reset();
    (fs.copyFileSync as jasmine.Spy).calls.reset();
  });

  it('should return 400 if required query parameters are missing', async () => {
    const testCases = [
      { query: { width: '100', height: '100' }, missing: 'src' },
      { query: { src: '/images/test.jpg', height: '100' }, missing: 'width' },
      { query: { src: '/images/test.jpg', width: '100' }, missing: 'height' },
      { query: {}, missing: 'all parameters' },
    ];

    for (const testCase of testCases) {
      req = { query: testCase.query } as unknown as Partial<RequestWithQuery>;
      await apiResizeHandler(req as RequestWithQuery, res);
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
    } as unknown as Partial<RequestWithQuery>;

    const expectedOriginalPath = path.join(
      process.cwd(),
      'public/images/test.jpg'
    );
    const expectedResizedPath = path.join(
      process.cwd(),
      'public/images/resized/resized-100x100-test.jpg'
    );

    // Both original and cache exist
    mockFs.existsSync.and.callFake((path: string) => {
      return path === expectedOriginalPath || path === expectedResizedPath;
    });

    await apiResizeHandler(req as RequestWithQuery, res);

    expect(mockResponse.setHeaderSpy).toHaveBeenCalledWith(
      'Content-Type',
      'image/jpeg'
    );
    expect(mockResponse.setHeaderSpy).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000'
    );
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
    mockFs.existsSync.and.callFake((path: string) => {
      return !path.includes('resized');
    });

    const expectedOriginalPath = path.join(
      process.cwd(),
      'public/images/test.jpg'
    );
    const expectedResizedPath = path.join(
      process.cwd(),
      'public/images/resized/resized-100x100-test.jpg'
    );

    await apiResizeHandler(req as RequestWithQuery, res);

    expect(mockSharp).toHaveBeenCalledWith(expectedOriginalPath);
    expect(mockSharp.instance.resize).toHaveBeenCalledWith(100, 100);
    expect(mockSharp.instance.jpeg).toHaveBeenCalledWith({ quality: 85 });
    expect(mockSharp.instance.toFile).toHaveBeenCalledWith(expectedResizedPath);
    expect(mockResponse.setHeaderSpy).toHaveBeenCalledWith(
      'Content-Type',
      'image/jpeg'
    );
    expect(mockResponse.setHeaderSpy).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000'
    );
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

    mockFs.existsSync.and.callFake((path: string) => {
      return !path.includes('resized');
    });

    await apiResizeHandler(req as RequestWithQuery, res);

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

    mockFs.existsSync.and.callFake((path: string) => {
      return !path.includes('resized');
    });
    mockFs.mkdirSync.and.throwError('Failed to create directory');

    await apiResizeHandler(req as RequestWithQuery, res);

    expect(mockResponse.statusSpy).toHaveBeenCalledWith(500);
    expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
      error: 'Failed to create resized directory',
    });
  });
});
