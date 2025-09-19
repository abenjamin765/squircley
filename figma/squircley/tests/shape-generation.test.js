/**
 * Tests for shape generation functions
 */
import { calculateSuperellipsePoint, applyRotation, generateSuperellipsePath, generateSquircleSvg, SHAPE_CONSTANTS, DEFAULT_PROPERTIES, } from "../src/shape-utils";
describe("Shape Generation", () => {
    describe("calculateSuperellipsePoint", () => {
        test("calculates point at angle 0 (rightmost point)", () => {
            const result = calculateSuperellipsePoint(0, 100, 100, 2);
            expect(result.x).toBeCloseTo(100, 5);
            expect(result.y).toBeCloseTo(0, 5);
        });
        test("calculates point at angle π/2 (topmost point)", () => {
            const result = calculateSuperellipsePoint(Math.PI / 2, 100, 100, 2);
            expect(result.x).toBeCloseTo(0, 5);
            expect(result.y).toBeCloseTo(-100, 5); // Negative because of coordinate system
        });
        test("calculates point at angle π (leftmost point)", () => {
            const result = calculateSuperellipsePoint(Math.PI, 100, 100, 2);
            expect(result.x).toBeCloseTo(-100, 5);
            expect(result.y).toBeCloseTo(0, 5);
        });
        test("calculates point at angle 3π/2 (bottommost point)", () => {
            const result = calculateSuperellipsePoint((3 * Math.PI) / 2, 100, 100, 2);
            expect(result.x).toBeCloseTo(0, 5);
            expect(result.y).toBeCloseTo(100, 5);
        });
        test("handles different power values", () => {
            const resultPower2 = calculateSuperellipsePoint(0, 100, 100, 2);
            const resultPower4 = calculateSuperellipsePoint(0, 100, 100, 4);
            // Higher power should result in more rectangular shape
            expect(Math.abs(resultPower4.x)).toBeLessThan(Math.abs(resultPower2.x));
        });
        test("handles different semi-major and semi-minor axes", () => {
            const result = calculateSuperellipsePoint(0, 150, 50, 2);
            expect(result.x).toBeCloseTo(150, 5);
            expect(result.y).toBeCloseTo(0, 5);
        });
    });
    describe("applyRotation", () => {
        test("does not change point when rotation is 0", () => {
            const point = { x: 10, y: 20 };
            const result = applyRotation(point, 0);
            expect(result.x).toBe(point.x);
            expect(result.y).toBe(point.y);
        });
        test("rotates point by 90 degrees", () => {
            const point = { x: 10, y: 0 };
            const result = applyRotation(point, 90);
            expect(result.x).toBeCloseTo(0, 5);
            expect(result.y).toBeCloseTo(10, 5);
        });
        test("rotates point by 180 degrees", () => {
            const point = { x: 10, y: 0 };
            const result = applyRotation(point, 180);
            expect(result.x).toBeCloseTo(-10, 5);
            expect(result.y).toBeCloseTo(0, 5);
        });
        test("rotates point by 45 degrees", () => {
            const point = { x: 10, y: 10 };
            const result = applyRotation(point, 45);
            expect(result.x).toBeCloseTo(0, 5);
            expect(result.y).toBeCloseTo(14.142, 3);
        });
    });
    describe("generateSuperellipsePath", () => {
        test("generates valid SVG path data", () => {
            const pathData = generateSuperellipsePath(100, 100, 2, 0);
            expect(typeof pathData).toBe("string");
            expect(pathData).toMatch(/^M /); // Should start with Move command
            expect(pathData).toMatch(/ Z$/); // Should end with Close path command
            expect(pathData).toMatch(/ C /); // Should contain Curve commands
        });
        test("handles rotation parameter", () => {
            const pathDataNoRotation = generateSuperellipsePath(100, 100, 2, 0);
            const pathDataWithRotation = generateSuperellipsePath(100, 100, 2, 45);
            expect(pathDataNoRotation).not.toBe(pathDataWithRotation);
            expect(pathDataWithRotation).toMatch(/^M /);
            expect(pathDataWithRotation).toMatch(/ Z$/);
        });
        test("generates different paths for different power values", () => {
            const pathDataPower2 = generateSuperellipsePath(100, 100, 2, 0);
            const pathDataPower4 = generateSuperellipsePath(100, 100, 4, 0);
            expect(pathDataPower2).not.toBe(pathDataPower4);
        });
        test("handles different axis lengths", () => {
            const pathData = generateSuperellipsePath(150, 50, 2, 0);
            expect(pathData).toMatch(/^M /);
            expect(pathData).toMatch(/ Z$/);
        });
    });
    describe("generateSquircleSvg", () => {
        test("generates valid SVG string", () => {
            const svgString = generateSquircleSvg(75);
            expect(typeof svgString).toBe("string");
            expect(svgString).toMatch(/^<svg/);
            expect(svgString).toMatch(/<\/svg>$/);
            expect(svgString).toContain('viewBox="0 0 289 289"');
            expect(svgString).toContain("<path");
        });
        test("includes correct dimensions", () => {
            const svgString = generateSquircleSvg(75);
            expect(svgString).toContain(`width="${DEFAULT_PROPERTIES.width}"`);
            expect(svgString).toContain(`height="${DEFAULT_PROPERTIES.height}"`);
        });
        test("includes correct colors", () => {
            const svgString = generateSquircleSvg(75);
            const expectedFillRgb = `rgb(${Math.round(DEFAULT_PROPERTIES.fillColor.r * 255)}, ${Math.round(DEFAULT_PROPERTIES.fillColor.g * 255)}, ${Math.round(DEFAULT_PROPERTIES.fillColor.b * 255)})`;
            const expectedStrokeRgb = `rgb(${Math.round(DEFAULT_PROPERTIES.strokeColor.r * 255)}, ${Math.round(DEFAULT_PROPERTIES.strokeColor.g * 255)}, ${Math.round(DEFAULT_PROPERTIES.strokeColor.b * 255)})`;
            expect(svgString).toContain(`fill="${expectedFillRgb}"`);
            expect(svgString).toContain(`stroke="${expectedStrokeRgb}"`);
            expect(svgString).toContain(`stroke-width="${DEFAULT_PROPERTIES.strokeWeight}"`);
        });
        test("generates different SVGs for different curvature values", () => {
            const svgStringLow = generateSquircleSvg(25);
            const svgStringHigh = generateSquircleSvg(75);
            expect(svgStringLow).not.toBe(svgStringHigh);
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
    describe("DEFAULT_PROPERTIES", () => {
        test("contains required properties", () => {
            expect(DEFAULT_PROPERTIES).toHaveProperty("width");
            expect(DEFAULT_PROPERTIES).toHaveProperty("height");
            expect(DEFAULT_PROPERTIES).toHaveProperty("fillColor");
            expect(DEFAULT_PROPERTIES).toHaveProperty("strokeColor");
            expect(DEFAULT_PROPERTIES).toHaveProperty("strokeWeight");
        });
        test("has valid color objects", () => {
            expect(DEFAULT_PROPERTIES.fillColor).toHaveProperty("r");
            expect(DEFAULT_PROPERTIES.fillColor).toHaveProperty("g");
            expect(DEFAULT_PROPERTIES.fillColor).toHaveProperty("b");
            expect(DEFAULT_PROPERTIES.strokeColor).toHaveProperty("r");
            expect(DEFAULT_PROPERTIES.strokeColor).toHaveProperty("g");
            expect(DEFAULT_PROPERTIES.strokeColor).toHaveProperty("b");
            // RGB values should be between 0 and 1
            Object.values(DEFAULT_PROPERTIES.fillColor).forEach((value) => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            });
            Object.values(DEFAULT_PROPERTIES.strokeColor).forEach((value) => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            });
        });
    });
});
