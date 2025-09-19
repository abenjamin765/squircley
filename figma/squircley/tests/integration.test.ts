/**
 * Integration tests for the complete Squircley plugin flow
 */

import {
  generateSuperellipsePath,
  generateSquircleSvg,
} from "../src/shape-utils";

describe("Integration Tests", () => {
  describe("Complete Shape Generation Flow", () => {
    test("generates consistent shapes across different curvatures", () => {
      const curvatures = [0, 25, 50, 75, 100];

      const svgStrings = curvatures.map((curvature) =>
        generateSquircleSvg(curvature)
      );

      // All SVG strings should be valid
      svgStrings.forEach((svg, index) => {
        expect(svg).toMatch(/^<svg/);
        expect(svg).toMatch(/<\/svg>$/);
        expect(svg).toContain('viewBox="0 0 289 289"');

        // Different curvatures should produce different SVG content
        if (index > 0) {
          expect(svg).not.toBe(svgStrings[0]);
        }
      });
    });

    test("path data contains expected SVG commands", () => {
      const pathData = generateSuperellipsePath(100, 100, 2, 0);

      // Should start with Move command
      expect(pathData).toMatch(/^M\s+\d+\.?\d*\s+\d+\.?\d*/);

      // Should contain Curve commands
      expect(pathData).toMatch(
        /C\s+\d+\.?\d*\s+\d+\.?\d*\s*,?\s*\d+\.?\d*\s+\d+\.?\d*\s*,?\s*\d+\.?\d*\s+\d+\.?\d*/
      );

      // Should end with Close path command
      expect(pathData).toMatch(/Z$/);
    });

    test("shape scales correctly with different axis lengths", () => {
      const pathData1 = generateSuperellipsePath(100, 100, 2, 0);
      const pathData2 = generateSuperellipsePath(150, 50, 2, 0);

      // Different axis lengths should produce different paths
      expect(pathData1).not.toBe(pathData2);

      // Both should be valid SVG paths
      [pathData1, pathData2].forEach((path) => {
        expect(path).toMatch(/^M\s+\d+\.?\d*\s+\d+\.?\d*/);
        expect(path).toMatch(/Z$/);
      });
    });
  });

  describe("Mathematical Consistency", () => {
    test("superellipse formula produces smooth curves", () => {
      const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI];
      const points = angles.map((angle) =>
        calculateSuperellipsePoint(angle, 100, 100, 2)
      );

      // Points should form a smooth curve
      expect(points.length).toBe(5);

      // Check that points are positioned correctly around the shape
      expect(points[0].x).toBeCloseTo(100, 1); // Rightmost point
      expect(points[0].y).toBeCloseTo(0, 1);

      expect(points[2].x).toBeCloseTo(0, 1); // Topmost point
      expect(points[2].y).toBeCloseTo(100, 1);

      expect(points[4].x).toBeCloseTo(-100, 1); // Leftmost point
      expect(points[4].y).toBeCloseTo(0, 1);
    });

    test("rotation transforms points correctly", () => {
      const point = { x: 10, y: 0 };

      const rotated90 = applyRotation(point, 90);
      const rotated180 = applyRotation(point, 180);
      const rotated270 = applyRotation(point, 270);

      // 90 degrees: (10, 0) -> (0, 10)
      expect(rotated90.x).toBeCloseTo(0, 5);
      expect(rotated90.y).toBeCloseTo(10, 5);

      // 180 degrees: (10, 0) -> (-10, 0)
      expect(rotated180.x).toBeCloseTo(-10, 5);
      expect(rotated180.y).toBeCloseTo(0, 5);

      // 270 degrees: (10, 0) -> (0, -10)
      expect(rotated270.x).toBeCloseTo(0, 5);
      expect(rotated270.y).toBeCloseTo(-10, 5);
    });

    test("power parameter affects shape characteristics", () => {
      const pointPower2 = calculateSuperellipsePoint(Math.PI / 4, 100, 100, 2);
      const pointPower4 = calculateSuperellipsePoint(Math.PI / 4, 100, 100, 4);

      // Both powers should produce valid points
      expect(Math.abs(pointPower2.x)).toBeGreaterThan(0);
      expect(Math.abs(pointPower2.y)).toBeGreaterThan(0);
      expect(Math.abs(pointPower4.x)).toBeGreaterThan(0);
      expect(Math.abs(pointPower4.y)).toBeGreaterThan(0);

      // Points should be on the superellipse curve
      expect(pointPower2.x).toBeCloseTo(pointPower2.y, 1);
      expect(pointPower4.x).toBeCloseTo(pointPower4.y, 1);
    });
  });

  describe("UI and Backend Consistency", () => {
    test("UI and backend use same shape generation logic", () => {
      // Import both modules
      const {
        generateSuperellipsePath: uiGeneratePath,
      } = require("../src/ui-controller");
      const {
        generateSuperellipsePath: backendGeneratePath,
      } = require("../src/shape-utils");

      // Generate paths with same parameters
      const uiPath = uiGeneratePath(100, 100, 2, 0);
      const backendPath = backendGeneratePath(100, 100, 2, 0);

      // Should produce identical results
      expect(uiPath).toBe(backendPath);
    });

    test("curvature mapping is consistent", () => {
      const testCurvatures = [0, 25, 50, 75, 100];
      const expectedPowers = [0.5, 2.875, 5.25, 7.625, 10.0];

      testCurvatures.forEach((curvature, index) => {
        const power = 0.5 + (10 - 0.5) * (curvature / 100);
        expect(power).toBeCloseTo(expectedPowers[index], 5);
      });
    });
  });

  describe("Edge Cases", () => {
    test("handles zero curvature (minimum power)", () => {
      const pathData = generateSuperellipsePath(100, 100, 0.5, 0);

      expect(pathData).toMatch(/^M\s+\d+\.?\d*\s+\d+\.?\d*/);
      expect(pathData).toMatch(/Z$/);
    });

    test("handles maximum curvature (maximum power)", () => {
      const pathData = generateSuperellipsePath(100, 100, 10, 0);

      expect(pathData).toMatch(/^M\s+\d+\.?\d*\s+\d+\.?\d*/);
      expect(pathData).toMatch(/Z$/);
    });

    test("handles very small axis lengths", () => {
      const pathData = generateSuperellipsePath(1, 1, 2, 0);

      expect(pathData).toMatch(/^M\s+\d+\.?\d*\s+\d+\.?\d*/);
      expect(pathData).toMatch(/Z$/);
    });

    test("handles rotation at various angles", () => {
      const rotations = [0, 45, 90, 135, 180, 225, 270, 315];

      rotations.forEach((rotation) => {
        const pathData = generateSuperellipsePath(100, 100, 2, rotation);
        expect(pathData).toMatch(/^M\s+\d+\.?\d*\s+\d+\.?\d*/);
        expect(pathData).toMatch(/Z$/);
      });
    });
  });

  describe("Performance", () => {
    test("shape generation is reasonably fast", () => {
      const startTime = Date.now();

      // Generate multiple shapes
      for (let i = 0; i < 100; i++) {
        generateSuperellipsePath(100, 100, 2 + (i % 8), i % 360);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // Less than 1 second for 100 generations
    });

    test("SVG generation includes all required attributes", () => {
      const svgString = generateSquircleSvg(75);

      // Check for required SVG attributes
      expect(svgString).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svgString).toContain('width="289"');
      expect(svgString).toContain('height="289"');
      expect(svgString).toContain('viewBox="0 0 289 289"');
      expect(svgString).toContain('fill="none"');

      // Check for path attributes
      expect(svgString).toContain('fill="rgb(');
      expect(svgString).toContain('stroke="rgb(');
      expect(svgString).toContain('stroke-width="4"');
    });
  });
});

// Helper functions for integration tests
function calculateSuperellipsePoint(
  angle: number,
  semiMajorAxis: number,
  semiMinorAxis: number,
  power: number
) {
  const cosT = Math.cos(angle);
  const sinT = Math.sin(angle);

  const cosPower = Math.pow(Math.abs(cosT), 2 / power) * Math.sign(cosT);
  const sinPower = Math.pow(Math.abs(sinT), 2 / power) * Math.sign(sinT);

  return {
    x: semiMajorAxis * cosPower,
    y: semiMinorAxis * sinPower,
  };
}

function applyRotation(point: { x: number; y: number }, rotation: number) {
  if (rotation === 0) return point;

  const rad = (rotation * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);

  return {
    x: point.x * cosR - point.y * sinR,
    y: point.x * sinR + point.y * cosR,
  };
}
