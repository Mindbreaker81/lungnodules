import '@testing-library/jest-dom';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.HTMLElement.prototype.scrollIntoView = jest.fn();
global.HTMLElement.prototype.hasPointerCapture = jest.fn();
global.HTMLElement.prototype.releasePointerCapture = jest.fn();
