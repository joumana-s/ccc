import { SharpSpy, createMockSharp } from '../helpers/mocks';

let mockSharp: SharpSpy = createMockSharp();

export const setMockSharp = (spy: SharpSpy) => {
  mockSharp = spy;
};

export default mockSharp;
