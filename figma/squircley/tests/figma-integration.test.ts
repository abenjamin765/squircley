/**
 * Tests for Figma integration functionality
 */

import { generateSquircleSvg } from "../src/shape-utils";
import {
  calculateSuperellipsePoint,
  applyRotation,
  generateSuperellipsePath,
} from "../src/ui-controller";

// Mock Figma API
const mockFigma = {
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
    center: { x: 100, y: 100 },
    scrollAndZoomIntoView: jest.fn(),
  },
  notify: jest.fn(),
  closePlugin: jest.fn(),
  on: jest.fn(),
};

// Set up global figma mock
(global as any).figma = mockFigma;

// Mock HTML template
(global as any).__html__ = "<html><body>Mock UI</body></html>";

describe("Figma Integration", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockFigma.currentPage.selection = [];
  });

  describe("SVG Generation", () => {
    test("generateSquircleSvg creates valid SVG", () => {
      const svgString = generateSquircleSvg(75);

      expect(svgString).toMatch(/^<svg/);
      expect(svgString).toMatch(/<\/svg>$/);
      expect(svgString).toContain('viewBox="0 0 289 289"');
    });

    test("generateSquircleSvg includes path data", () => {
      const svgString = generateSquircleSvg(75);

      expect(svgString).toContain('<path d="');
      expect(svgString).toContain('fill="rgb(');
      expect(svgString).toContain('stroke="rgb(');
    });
  });

  describe("Mock Figma API", () => {
    test("figma API mock is properly configured", () => {
      expect(mockFigma.showUI).toBeDefined();
      expect(mockFigma.ui.onmessage).toBeNull();
      expect(mockFigma.currentPage).toBeDefined();
      expect(mockFigma.viewport).toBeDefined();
    });
  });

  describe("Message Handling", () => {
    // Mock message handler that simulates the plugin's message handling
    const createMockMessageHandler = () => {
      return (msg: { type: string; curvature?: number }) => {
        try {
          switch (msg.type) {
            case "create-squircle":
              if (typeof msg.curvature !== "number") {
                throw new Error(
                  "Curvature value is required for create-squircle"
                );
              }
              const svgString = generateSquircleSvg(msg.curvature);
              const svgNode = mockFigma.createNodeFromSvg(svgString);

              // Check if there's a selected frame
              const selectedFrame =
                mockFigma.currentPage.selection &&
                mockFigma.currentPage.selection.length > 0
                  ? mockFigma.currentPage.selection[0]
                  : null;

              if (
                selectedFrame &&
                typeof (selectedFrame as any).appendChild === "function"
              ) {
                (selectedFrame as any).appendChild(svgNode);
              } else {
                mockFigma.currentPage.appendChild(svgNode);

                // Center the node in viewport
                if (svgNode && typeof svgNode === "object") {
                  (svgNode as any).x = 100 - 289 / 2;
                  (svgNode as any).y = 100 - 289 / 2;
                }

                // Name auto-generated frames
                if (svgNode && (svgNode as any).type === "FRAME") {
                  (svgNode as any).name = "Squircle";
                }

                (mockFigma.currentPage.selection as any) = [svgNode];
                mockFigma.viewport.scrollAndZoomIntoView([svgNode]);
              }

              mockFigma.notify("Squircle created successfully!");
              break;
            case "cancel":
              mockFigma.closePlugin();
              break;
            default:
              console.warn("Unknown message type:", msg.type);
              break;
          }
        } catch (error) {
          console.error("Plugin error:", error);
          mockFigma.notify("An error occurred. Please try again.");
        }
      };
    };

    let handleUIMessage: any;

    beforeEach(() => {
      handleUIMessage = createMockMessageHandler();
    });

    test("handles create-squircle message", () => {
      const mockSvgNode = { type: "FRAME", name: "Test" };
      mockFigma.createNodeFromSvg.mockReturnValue(mockSvgNode);

      const message = { type: "create-squircle", curvature: 75 };

      handleUIMessage(message);

      expect(mockFigma.createNodeFromSvg).toHaveBeenCalledWith(
        expect.stringContaining("<svg")
      );
      expect(mockFigma.currentPage.appendChild).toHaveBeenCalledWith(
        mockSvgNode
      );
      expect(mockFigma.notify).toHaveBeenCalledWith(
        "Squircle created successfully!"
      );
    });

    test("handles create-squircle with selected frame", () => {
      const mockFrame = { type: "FRAME", appendChild: jest.fn() } as any;
      const mockSvgNode = { type: "SVG" } as any;

      (mockFigma.currentPage.selection as any) = [mockFrame];
      mockFigma.currentPage.find.mockReturnValue(mockFrame);
      mockFigma.createNodeFromSvg.mockReturnValue(mockSvgNode);

      const message = { type: "create-squircle", curvature: 50 };

      handleUIMessage(message);

      expect(mockFrame.appendChild).toHaveBeenCalledWith(mockSvgNode);
      expect(mockFigma.currentPage.appendChild).not.toHaveBeenCalled();
    });

    test("handles cancel message", () => {
      const message = { type: "cancel" };

      handleUIMessage(message);

      expect(mockFigma.closePlugin).toHaveBeenCalled();
    });

    test("handles unknown message type", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const message = { type: "unknown" };

      handleUIMessage(message);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Unknown message type:",
        "unknown"
      );

      consoleWarnSpy.mockRestore();
    });

    test("handles create-squircle without curvature", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const message = { type: "create-squircle" };

      handleUIMessage(message);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockFigma.notify).toHaveBeenCalledWith(
        "An error occurred. Please try again."
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Node Creation and Positioning", () => {
    const createMockMessageHandler = () => {
      return (msg: { type: string; curvature?: number }) => {
        try {
          switch (msg.type) {
            case "create-squircle":
              if (typeof msg.curvature !== "number") {
                throw new Error(
                  "Curvature value is required for create-squircle"
                );
              }
              const svgString = generateSquircleSvg(msg.curvature);
              const svgNode = mockFigma.createNodeFromSvg(svgString);
              mockFigma.currentPage.appendChild(svgNode);
              (mockFigma.currentPage.selection as any) = [svgNode];
              mockFigma.viewport.scrollAndZoomIntoView([svgNode]);
              mockFigma.notify("Squircle created successfully!");
              break;
            case "cancel":
              mockFigma.closePlugin();
              break;
            default:
              console.warn("Unknown message type:", msg.type);
              break;
          }
        } catch (error) {
          console.error("Plugin error:", error);
          mockFigma.notify("An error occurred. Please try again.");
        }
      };
    };
    test("centers node in viewport when no frame selected", () => {
      const mockSvgNode = {
        type: "FRAME",
        name: "Test",
        width: 289,
        height: 289,
        x: 0,
        y: 0,
      } as any;
      mockFigma.createNodeFromSvg.mockReturnValue(mockSvgNode);

      const handleUIMessage = createMockMessageHandler();
      const message = { type: "create-squircle", curvature: 75 };

      handleUIMessage(message);

      expect(mockSvgNode.x).toBe(100 - 289 / 2); // viewport.center.x - width/2
      expect(mockSvgNode.y).toBe(100 - 289 / 2); // viewport.center.y - height/2
    });

    test("names auto-generated frames", () => {
      const mockSvgNode = { type: "FRAME", name: "" } as any;
      mockFigma.createNodeFromSvg.mockReturnValue(mockSvgNode);

      const handleUIMessage = createMockMessageHandler();
      const message = { type: "create-squircle", curvature: 75 };

      handleUIMessage(message);

      expect(mockSvgNode.name).toBe("Squircle");
    });

    test("scrolls and zooms to created node", () => {
      const mockSvgNode = { type: "FRAME", name: "Test" } as any;
      mockFigma.createNodeFromSvg.mockReturnValue(mockSvgNode);

      const handleUIMessage = createMockMessageHandler();
      const message = { type: "create-squircle", curvature: 75 };

      handleUIMessage(message);

      expect(mockFigma.viewport.scrollAndZoomIntoView).toHaveBeenCalledWith([
        mockSvgNode,
      ]);
      expect(mockFigma.currentPage.selection).toEqual([mockSvgNode]);
    });
  });

  describe("Error Handling", () => {
    const createMockMessageHandler = () => {
      return (msg: { type: string; curvature?: number }) => {
        try {
          switch (msg.type) {
            case "create-squircle":
              if (typeof msg.curvature !== "number") {
                throw new Error(
                  "Curvature value is required for create-squircle"
                );
              }
              const svgString = generateSquircleSvg(msg.curvature);
              const svgNode = mockFigma.createNodeFromSvg(svgString);
              mockFigma.currentPage.appendChild(svgNode);
              (mockFigma.currentPage.selection as any) = [svgNode];
              mockFigma.viewport.scrollAndZoomIntoView([svgNode]);
              mockFigma.notify("Squircle created successfully!");
              break;
            case "cancel":
              mockFigma.closePlugin();
              break;
            default:
              console.warn("Unknown message type:", msg.type);
              break;
          }
        } catch (error) {
          console.error("Plugin error:", error);
          mockFigma.notify("An error occurred. Please try again.");
        }
      };
    };

    test("handles errors during squircle creation", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockFigma.createNodeFromSvg.mockImplementation(() => {
        throw new Error("SVG creation failed");
      });

      const handleUIMessage = createMockMessageHandler();
      const message = { type: "create-squircle", curvature: 75 };

      handleUIMessage(message);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockFigma.notify).toHaveBeenCalledWith(
        "An error occurred. Please try again."
      );

      consoleErrorSpy.mockRestore();
    });

    test("handles frame selection errors", () => {
      mockFigma.currentPage.find.mockImplementation(() => {
        throw new Error("Selection error");
      });

      const handleUIMessage = createMockMessageHandler();
      const message = { type: "create-squircle", curvature: 75 };

      expect(() => handleUIMessage(message)).not.toThrow();
      expect(mockFigma.notify).toHaveBeenCalledWith(
        "An error occurred. Please try again."
      );
    });
  });
});
