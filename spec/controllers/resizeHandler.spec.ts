import {
  createMockResponse,
  createMockFs,
  MockResponse,
  MockFs,
} from '../helpers/mocks';
import {
  createMockSharp,
  createFailingMockSharp,
  SharpSpy,
} from '../helpers/mocks';
import * as path from 'path';

interface RequestWithQuery extends Request {
  query?: Record<string, any>;
}

const proxyquire = require('proxyquire');

describe('resizeHandler', () => {
  let req: Partial<RequestWithQuery>;
  let res: Response;
  let mockResponse: MockResponse;
  let mockFs: MockFs;
  let mockSharp: SharpSpy;
  let resizeHandler: any;

  beforeAll(() => {
    // Create sharp mock
    mockSharp = createMockSharp();

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

  it('should return 400 if required parameters are missing', async () => {
    const testCases = [
      { body: { width: '100', height: '100' }, missing: 'filename' },
      { body: { filename: 'test.jpg', height: '100' }, missing: 'width' },
      { body: { filename: 'test.jpg', width: '100' }, missing: 'height' },
      { body: {}, missing: 'all parameters' },
    ];

    for (const testCase of testCases) {
      req = { body: testCase.body } as unknown as Partial<RequestWithQuery>;
      await resizeHandler(req as RequestWithQuery, res);
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
    } as unknown as Partial<RequestWithQuery>;

    mockFs.existsSync.and.returnValue(false);

    await resizeHandler(req as RequestWithQuery, res);

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
    } as unknown as Partial<RequestWithQuery>;

    mockFs.existsSync.and.returnValue(true);

    const expectedOriginalPath = path.join(
      process.cwd(),
      'public/images',
      filename
    );
    const expectedResizedPath = path.join(
      process.cwd(),
      'public/images/resized',
      `resized-${width}x${height}-${filename}`
    );

    await resizeHandler(req as RequestWithQuery, res);

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
    const failingSharp = createFailingMockSharp(error);

    // Import controller with failingSharp mock using proxyquire
    const controllerWithFailingSharp = proxyquire(
      '../../server/controllers/resizeController',
      {
        sharp: failingSharp,
      }
    );

    const resizeHandlerWithFailingSharp =
      controllerWithFailingSharp.resizeHandler;

    req = {
      body: {
        filename: 'test.jpg',
        width: '100',
        height: '100',
      },
    } as unknown as Partial<RequestWithQuery>;

    mockFs.existsSync.and.returnValue(true);

    await resizeHandlerWithFailingSharp(req as RequestWithQuery, res);

    const expectedOriginalPath = path.join(
      process.cwd(),
      'public/images',
      'test.jpg'
    );
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
      } as unknown as Partial<RequestWithQuery>;

      mockFs.existsSync.and.returnValue(true);

      await resizeHandler(req as RequestWithQuery, res);

      expect(mockResponse.statusSpy).toHaveBeenCalledWith(400);
      expect(mockResponse.jsonSpy).toHaveBeenCalledWith({
        error: 'Invalid dimensions. Width and height must be positive numbers.',
      });
      mockResponse.statusSpy.calls.reset();
      mockResponse.jsonSpy.calls.reset();
    }
  });
});
