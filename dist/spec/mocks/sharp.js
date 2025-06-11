"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMockSharp = void 0;
const mocks_1 = require("../helpers/mocks");
let mockSharp = (0, mocks_1.createMockSharp)();
const setMockSharp = (spy) => {
    mockSharp = spy;
};
exports.setMockSharp = setMockSharp;
exports.default = mockSharp;
