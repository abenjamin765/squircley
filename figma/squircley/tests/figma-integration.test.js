/**
 * Tests for Figma integration functionality
 */
import { generateSquircleSvg } from "../src/shape-utils";
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
global.figma = mockFigma;
// Mock HTML template
global.__html__ = "<html><body>Mock UI</body></html>";
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
        test("figma.showUI is called during initialization", () => {
            // Import the code module which should call figma.showUI
            require("../code");
            expect(mockFigma.showUI).toHaveBeenCalledWith(expect.stringContaining("<html>"), expect.objectContaining({
                width: 300,
                height: 300,
            }));
        });
        test("figma.ui.onmessage is set up", () => {
            require("../code");
            expect(typeof mockFigma.ui.onmessage).toBe("function");
        });
    });
    describe("Message Handling", () => {
        let handleUIMessage;
        beforeEach(() => {
            // Reset the module to get a fresh instance
            jest.resetModules();
            require("../code");
            handleUIMessage = mockFigma.ui.onmessage;
        });
        test("handles create-squircle message", () => {
            const mockSvgNode = { type: "FRAME", name: "Test" };
            mockFigma.createNodeFromSvg.mockReturnValue(mockSvgNode);
            const message = { type: "create-squircle", curvature: 75 };
            handleUIMessage(message);
            expect(mockFigma.createNodeFromSvg).toHaveBeenCalledWith(expect.stringContaining("<svg"));
            expect(mockFigma.currentPage.appendChild).toHaveBeenCalledWith(mockSvgNode);
            expect(mockFigma.notify).toHaveBeenCalledWith("Squircle created successfully!");
        });
        test("handles create-squircle with selected frame", () => {
            const mockFrame = { type: "FRAME", appendChild: jest.fn() };
            const mockSvgNode = { type: "SVG" };
            mockFigma.currentPage.selection = [mockFrame];
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
            expect(consoleWarnSpy).toHaveBeenCalledWith("Unknown message type:", "unknown");
            consoleWarnSpy.mockRestore();
        });
        test("handles create-squircle without curvature", () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            const message = { type: "create-squircle" };
            handleUIMessage(message);
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mockFigma.notify).toHaveBeenCalledWith("An error occurred. Please try again.");
            consoleErrorSpy.mockRestore();
        });
    });
    describe("Node Creation and Positioning", () => {
        test("centers node in viewport when no frame selected", () => {
            const mockSvgNode = {
                type: "FRAME",
                name: "Test",
                width: 289,
                height: 289,
            };
            mockFigma.createNodeFromSvg.mockReturnValue(mockSvgNode);
            const handleUIMessage = mockFigma.ui.onmessage;
            const message = { type: "create-squircle", curvature: 75 };
            handleUIMessage(message);
            expect(mockSvgNode.x).toBe(100 - 289 / 2); // viewport.center.x - width/2
            expect(mockSvgNode.y).toBe(100 - 289 / 2); // viewport.center.y - height/2
        });
        test("names auto-generated frames", () => {
            const mockSvgNode = { type: "FRAME" };
            mockFigma.createNodeFromSvg.mockReturnValue(mockSvgNode);
            const handleUIMessage = mockFigma.ui.onmessage;
            const message = { type: "create-squircle", curvature: 75 };
            handleUIMessage(message);
            expect(mockSvgNode.name).toBe("Squircle");
        });
        test("scrolls and zooms to created node", () => {
            const mockSvgNode = { type: "FRAME", name: "Test" };
            mockFigma.createNodeFromSvg.mockReturnValue(mockSvgNode);
            const handleUIMessage = mockFigma.ui.onmessage;
            const message = { type: "create-squircle", curvature: 75 };
            handleUIMessage(message);
            expect(mockFigma.viewport.scrollAndZoomIntoView).toHaveBeenCalledWith([
                mockSvgNode,
            ]);
            expect(mockFigma.currentPage.selection).toEqual([mockSvgNode]);
        });
    });
    describe("Error Handling", () => {
        test("handles errors during squircle creation", () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            mockFigma.createNodeFromSvg.mockImplementation(() => {
                throw new Error("SVG creation failed");
            });
            const handleUIMessage = mockFigma.ui.onmessage;
            const message = { type: "create-squircle", curvature: 75 };
            handleUIMessage(message);
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mockFigma.notify).toHaveBeenCalledWith("An error occurred. Please try again.");
            consoleErrorSpy.mockRestore();
        });
        test("handles frame selection errors", () => {
            mockFigma.currentPage.find.mockImplementation(() => {
                throw new Error("Selection error");
            });
            const handleUIMessage = mockFigma.ui.onmessage;
            const message = { type: "create-squircle", curvature: 75 };
            expect(() => handleUIMessage(message)).not.toThrow();
            expect(mockFigma.notify).toHaveBeenCalledWith("An error occurred. Please try again.");
        });
    });
});
