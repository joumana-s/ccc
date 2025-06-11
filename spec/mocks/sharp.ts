import { SharpSpy, createMockSharp } from '../helpers/mocks';

let mockSharp: SharpSpy = createMockSharp();

export const setMockSharp = (spy: SharpSpy): void => {
  mockSharp = spy;
};

export default mockSharp;
