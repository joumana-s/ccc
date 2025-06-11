"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFailingMockSharp = exports.createMockSharp = exports.createMockFs = exports.createMockResponse = void 0;
const createMockResponse = () => {
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
exports.createMockResponse = createMockResponse;
const createMockFs = () => {
    return {
        existsSync: jasmine.createSpy('existsSync'),
        mkdirSync: jasmine.createSpy('mkdirSync'),
        copyFileSync: jasmine.createSpy('copyFileSync'),
    };
};
exports.createMockFs = createMockFs;
const createMockSharp = () => {
    const sharpInstance = {
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
    sharpSpy.reset = resetAllSpies;
    sharpSpy.instance = sharpInstance;
    return sharpSpy;
};
exports.createMockSharp = createMockSharp;
const createFailingMockSharp = (error = new Error('Sharp processing failed')) => {
    const sharpInstance = {
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
    sharpSpy.reset = resetAllSpies;
    sharpSpy.instance = sharpInstance;
    return sharpSpy;
};
exports.createFailingMockSharp = createFailingMockSharp;
