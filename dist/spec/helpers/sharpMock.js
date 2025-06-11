"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockSharp = createMockSharp;
exports.createFailingMockSharp = createFailingMockSharp;
function createMockSharp() {
    const mockToFile = jasmine
        .createSpy('toFile')
        .and.returnValue(Promise.resolve());
    const mockInstance = {
        resize: jasmine.createSpy('resize').and.callFake(() => mockInstance),
        jpeg: jasmine.createSpy('jpeg').and.callFake(() => mockInstance),
        toFile: mockToFile,
    };
    const sharpSpy = jasmine.createSpy('sharp').and.returnValue(mockInstance);
    return sharpSpy;
}
function createFailingMockSharp(error) {
    const mockToFile = jasmine
        .createSpy('toFile')
        .and.returnValue(Promise.reject(error));
    const mockInstance = {
        resize: jasmine.createSpy('resize').and.callFake(() => mockInstance),
        jpeg: jasmine.createSpy('jpeg').and.callFake(() => mockInstance),
        toFile: mockToFile,
    };
    const sharpSpy = jasmine.createSpy('sharp').and.returnValue(mockInstance);
    return sharpSpy;
}
