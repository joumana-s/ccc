type Spy = jasmine.Spy;

export interface SharpInstance {
  resize: (width: number, height: number) => SharpInstance;
  jpeg: (options?: { quality?: number }) => SharpInstance;
  toFile: (path: string) => Promise<void>;
}

export function createMockSharp(): Spy {
  const mockToFile = jasmine
    .createSpy('toFile')
    .and.returnValue(Promise.resolve());

  const mockInstance: SharpInstance = {
    resize: jasmine.createSpy('resize').and.callFake(() => mockInstance),
    jpeg: jasmine.createSpy('jpeg').and.callFake(() => mockInstance),
    toFile: mockToFile,
  };

  const sharpSpy = jasmine.createSpy('sharp').and.returnValue(mockInstance);
  return sharpSpy;
}

export function createFailingMockSharp(error: Error): Spy {
  const mockToFile = jasmine
    .createSpy('toFile')
    .and.returnValue(Promise.reject(error));

  const mockInstance: SharpInstance = {
    resize: jasmine.createSpy('resize').and.callFake(() => mockInstance),
    jpeg: jasmine.createSpy('jpeg').and.callFake(() => mockInstance),
    toFile: mockToFile,
  };

  const sharpSpy = jasmine.createSpy('sharp').and.returnValue(mockInstance);
  return sharpSpy;
}
