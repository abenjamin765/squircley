/**
 * Tests for UI Controller
 */

import {
  calculateSuperellipsePoint,
  applyRotation,
  generateSuperellipsePath,
  initializeUIController,
  updatePreview,
  updateSliderValue,
  getCurrentCurvature,
  setCurrentCurvature,
  handleCreateClick,
  handleSliderInput,
  SHAPE_CONSTANTS,
  type UIControllerElements,
} from "../src/ui-controller";

describe("UI Controller", () => {
  let mockElements: UIControllerElements;

  beforeEach(() => {
    // Create mock DOM elements
    mockElements = {
      createButton: document.createElement("button"),
      curvatureSlider: document.createElement("input") as HTMLInputElement,
      curvatureValue: document.createElement("span"),
      previewPath: document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      ) as SVGPathElement,
      previewSvg: document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      ) as SVGSVGElement,
    };

    // Set up slider properties
    if (mockElements.curvatureSlider) {
      mockElements.curvatureSlider.type = "range";
      mockElements.curvatureSlider.min = "0";
      mockElements.curvatureSlider.max = "100";
      mockElements.curvatureSlider.value = "75";
    }

    // Reset current curvature
    setCurrentCurvature(75);
  });

  describe("Shape Generation Functions", () => {
    test("calculateSuperellipsePoint works in UI context", () => {
      const result = calculateSuperellipsePoint(0, 100, 100, 2);

      expect(result.x).toBeCloseTo(100, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    test("applyRotation works in UI context", () => {
      const point = { x: 10, y: 0 };
      const result = applyRotation(point, 90);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(10, 5);
    });

    test("generateSuperellipsePath works in UI context", () => {
      const pathData = generateSuperellipsePath(100, 100, 2, 0);

      expect(typeof pathData).toBe("string");
      expect(pathData).toMatch(/^M /);
      expect(pathData).toMatch(/ Z$/);
    });
  });

  describe("UI State Management", () => {
    test("getCurrentCurvature returns current value", () => {
      expect(getCurrentCurvature()).toBe(75);
    });

    test("setCurrentCurvature updates value", () => {
      setCurrentCurvature(50);
      expect(getCurrentCurvature()).toBe(50);
    });

    test("setCurrentCurvature clamps values to 0-100 range", () => {
      setCurrentCurvature(-10);
      expect(getCurrentCurvature()).toBe(0);

      setCurrentCurvature(150);
      expect(getCurrentCurvature()).toBe(100);
    });
  });

  describe("UI Interactions", () => {
    test("updateSliderValue updates current curvature from slider", () => {
      if (mockElements.curvatureSlider) {
        mockElements.curvatureSlider.value = "30";
      }

      updateSliderValue(mockElements);

      expect(getCurrentCurvature()).toBe(30);
    });

    test("updateSliderValue updates curvature value display", () => {
      if (mockElements.curvatureSlider) {
        mockElements.curvatureSlider.value = "45";
      }

      updateSliderValue(mockElements);

      if (mockElements.curvatureValue) {
        expect(mockElements.curvatureValue.textContent).toBe("45");
      }
    });

    test("updatePreview updates SVG path data", () => {
      updatePreview(mockElements);

      if (mockElements.previewPath) {
        const pathData = mockElements.previewPath.getAttribute("d");
        expect(pathData).toMatch(/^M /);
        expect(pathData).toMatch(/ Z$/);
      }
    });

    test("handleSliderInput calls updateSliderValue", () => {
      if (mockElements.curvatureSlider) {
        mockElements.curvatureSlider.value = "60";
      }

      handleSliderInput(mockElements);

      expect(getCurrentCurvature()).toBe(60);
    });

    test("handleCreateClick sends plugin message", () => {
      const mockPostMessage = jest.fn();
      (global as any).parent = { postMessage: mockPostMessage };

      handleCreateClick(mockElements);

      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: "create-squircle",
            curvature: 75,
          },
        },
        "*"
      );
    });

    test("handleCreateClick adds exit animation class", () => {
      handleCreateClick(mockElements);

      if (mockElements.previewSvg) {
        expect(
          mockElements.previewSvg.classList.contains("exit-animation")
        ).toBe(true);
      }
    });

    test("handleCreateClick resets animation after delay", () => {
      jest.useFakeTimers();

      handleCreateClick(mockElements);

      // Fast-forward time
      jest.advanceTimersByTime(500);

      if (mockElements.previewSvg) {
        expect(
          mockElements.previewSvg.classList.contains("exit-animation")
        ).toBe(false);
      }

      jest.useRealTimers();
    });
  });

  describe("Initialization", () => {
    test("initializeUIController sets up initial state", () => {
      initializeUIController(mockElements);

      // Should have set up the preview
      if (mockElements.previewPath) {
        expect(mockElements.previewPath.getAttribute("d")).toBeTruthy();
      }

      // Should have updated the slider value display
      if (mockElements.curvatureValue) {
        expect(mockElements.curvatureValue.textContent).toBe("75");
      }
    });
  });

  describe("SHAPE_CONSTANTS", () => {
    test("contains required properties", () => {
      expect(SHAPE_CONSTANTS).toHaveProperty("center");
      expect(SHAPE_CONSTANTS).toHaveProperty("semiMajorAxis");
      expect(SHAPE_CONSTANTS).toHaveProperty("semiMinorAxis");
      expect(SHAPE_CONSTANTS).toHaveProperty("controlFactor");
      expect(SHAPE_CONSTANTS).toHaveProperty("tangentOffset");
    });

    test("has reasonable values", () => {
      expect(SHAPE_CONSTANTS.center).toBeGreaterThan(0);
      expect(SHAPE_CONSTANTS.semiMajorAxis).toBeGreaterThan(0);
      expect(SHAPE_CONSTANTS.semiMinorAxis).toBeGreaterThan(0);
      expect(SHAPE_CONSTANTS.controlFactor).toBeGreaterThan(0);
      expect(SHAPE_CONSTANTS.controlFactor).toBeLessThanOrEqual(1);
      expect(SHAPE_CONSTANTS.tangentOffset).toBeGreaterThan(0);
    });
  });
});
