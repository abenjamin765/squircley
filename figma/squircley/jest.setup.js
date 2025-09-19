// Mock Figma API
global.figma = {
  showUI: jest.fn(),
  ui: {
    onmessage: null,
  },
  currentPage: {
    selection: [],
    appendChild: jest.fn(),
    find: jest.fn(),
  },
  createNodeFromSvg: jest.fn(),
  viewport: {
    center: { x: 0, y: 0 },
    scrollAndZoomIntoView: jest.fn(),
  },
  notify: jest.fn(),
  closePlugin: jest.fn(),
  on: jest.fn(),
};

// Mock HTML template loading for UI
global.__html__ = "<html><body>Mock UI</body></html>";

// Mock DOM elements for UI tests
Object.defineProperty(window, "parent", {
  value: {
    postMessage: jest.fn(),
  },
  writable: true,
});
