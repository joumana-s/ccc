import { Request, Response } from 'express';

type Spy = jasmine.Spy;

export interface MockResponse {
  res: Partial<Response>;
  statusSpy: Spy;
  jsonSpy: Spy;
  sendFileSpy: Spy;
  setHeaderSpy: Spy;
}

export const createMockResponse = (): MockResponse => {
  const statusSpy = jasmine.createSpy('status');
  const jsonSpy = jasmine.createSpy('json');
  const sendFileSpy = jasmine.createSpy('sendFile');
  const setHeaderSpy = jasmine.createSpy('setHeader');

  const res = {
    status: statusSpy,
    json: jsonSpy,
    sendFile: sendFileSpy,
    setHeader: setHeaderSpy,
  };

  statusSpy.and.returnValue(res);

  return {
    res,
    statusSpy,
    jsonSpy,
    sendFileSpy,
    setHeaderSpy,
  };
};

export interface MockFs {
  existsSync: Spy;
  mkdirSync: Spy;
  copyFileSync: Spy;
}

export const createMockFs = (): MockFs => {
  return {
    existsSync: jasmine.createSpy('existsSync'),
    mkdirSync: jasmine.createSpy('mkdirSync'),
    copyFileSync: jasmine.createSpy('copyFileSync'),
  };
};

export interface SharpMock {
  resize: jasmine.Spy;
  jpeg: jasmine.Spy;
  toFile: jasmine.Spy;
  calls?: jasmine.Calls<jasmine.Spy>;
}

export interface SharpSpy extends jasmine.Spy {
  reset: () => void;
  instance: SharpMock;
}

export const createMockSharp = (): SharpSpy => {
  const sharpInstance: SharpMock = {
    resize: jasmine.createSpy('resize'),
    jpeg: jasmine.createSpy('jpeg'),
    toFile: jasmine.createSpy('toFile'),
  };

  // Set up chaining with proper promise resolution
  sharpInstance.resize.and.returnValue(sharpInstance);
  sharpInstance.jpeg.and.returnValue(sharpInstance);
  sharpInstance.toFile.and.returnValue(Promise.resolve());

  // Create the main sharp spy that returns the instance
  const sharpSpy = jasmine.createSpy('sharp').and.returnValue(sharpInstance);

  // Add reset functionality
  const resetAllSpies = () => {
    sharpSpy.calls.reset();
    sharpInstance.resize.calls.reset();
    sharpInstance.jpeg.calls.reset();
    sharpInstance.toFile.calls.reset();
  };

  // Add reset method and instance to spy
  (sharpSpy as any).reset = resetAllSpies;
  (sharpSpy as any).instance = sharpInstance;

  return sharpSpy as SharpSpy;
};

export const createFailingMockSharp = (
  error: Error = new Error('Sharp processing failed')
): SharpSpy => {
  const sharpInstance: SharpMock = {
    resize: jasmine.createSpy('resize'),
    jpeg: jasmine.createSpy('jpeg'),
    toFile: jasmine.createSpy('toFile'),
  };

  // Set up chaining with proper promise rejection
  sharpInstance.resize.and.returnValue(sharpInstance);
  sharpInstance.jpeg.and.returnValue(sharpInstance);
  sharpInstance.toFile.and.returnValue(Promise.reject(error));

  // Create the main sharp spy that returns the instance
  const sharpSpy = jasmine.createSpy('sharp').and.returnValue(sharpInstance);

  // Add reset functionality
  const resetAllSpies = () => {
    sharpSpy.calls.reset();
    sharpInstance.resize.calls.reset();
    sharpInstance.jpeg.calls.reset();
    sharpInstance.toFile.calls.reset();
  };

  // Add reset method and instance to spy
  (sharpSpy as any).reset = resetAllSpies;
  (sharpSpy as any).instance = sharpInstance;

  return sharpSpy as SharpSpy;
};
