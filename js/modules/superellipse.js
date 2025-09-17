/**
 * Superellipse/Squircle mathematical generation module
 * Contains the core algorithms for generating superellipse shapes
 */

import { SHAPE_CONSTANTS, ANIMATION_CONSTANTS } from "./config.js";

/**
 * Generate a superellipse path using 4 cubic Bézier curves
 * @param {number} a - Semi-major axis
 * @param {number} b - Semi-minor axis
 * @param {number} p - Curvature parameter (higher = more rectangular)
 * @param {number} rotation - Rotation angle in degrees
 * @returns {string} SVG path data
 */
export function generateSuperellipsePath(a, b, p, rotation = 0) {
  const { center, controlFactor } = SHAPE_CONSTANTS;
  const { tangentOffset } = ANIMATION_CONSTANTS;

  // Calculate the key points for the superellipse
  // For a superellipse, we need the points at 0°, 90°, 180°, 270°
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const keyPoints = [];

  for (const angle of angles) {
    const cosT = Math.cos(angle);
    const sinT = Math.sin(angle);

    // Superellipse parametric equations
    const cosPower = Math.pow(Math.abs(cosT), 2 / p) * Math.sign(cosT);
    const sinPower = Math.pow(Math.abs(sinT), 2 / p) * Math.sign(sinT);

    let x = a * cosPower;
    let y = b * sinPower;

    // Apply rotation if specified
    if (rotation !== 0) {
      const rad = (rotation * Math.PI) / 180;
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);
      const newX = x * cosR - y * sinR;
      const newY = x * sinR + y * cosR;
      x = newX;
      y = newY;
    }

    // Center the shape
    x += center;
    y += center;

    keyPoints.push([x, y]);
  }

  // For better superellipse approximation, we need to calculate intermediate points
  // and derive control points from the actual curve tangents
  const [p0, p1, p2, p3] = keyPoints; // right, top, left, bottom

  // Calculate tangent points slightly offset from key points to get proper control directions
  const tangentPoints = [];

  for (let i = 0; i < 4; i++) {
    const baseAngle = (i * Math.PI) / 2;
    const angle1 = baseAngle - tangentOffset;
    const angle2 = baseAngle + tangentOffset;

    // Calculate points slightly before and after each key point
    const calcPoint = (angle) => {
      const cosT = Math.cos(angle);
      const sinT = Math.sin(angle);
      const cosPower = Math.pow(Math.abs(cosT), 2 / p) * Math.sign(cosT);
      const sinPower = Math.pow(Math.abs(sinT), 2 / p) * Math.sign(sinT);

      let x = a * cosPower;
      let y = b * sinPower;

      if (rotation !== 0) {
        const rad = (rotation * Math.PI) / 180;
        const cosR = Math.cos(rad);
        const sinR = Math.sin(rad);
        const newX = x * cosR - y * sinR;
        const newY = x * sinR + y * cosR;
        x = newX;
        y = newY;
      }

      return [x + center, y + center];
    };

    const before = calcPoint(angle1);
    const after = calcPoint(angle2);
    tangentPoints.push({ before, after });
  }

  // Calculate control points based on tangent directions
  const curves = [
    // Right to top
    {
      start: [p0[0], p0[1]],
      cp1: [
        p0[0] +
          (tangentPoints[0].after[0] - tangentPoints[0].before[0]) *
            controlFactor,
        p0[1] +
          (tangentPoints[0].after[1] - tangentPoints[0].before[1]) *
            controlFactor,
      ],
      cp2: [
        p1[0] -
          (tangentPoints[1].after[0] - tangentPoints[1].before[0]) *
            controlFactor,
        p1[1] -
          (tangentPoints[1].after[1] - tangentPoints[1].before[1]) *
            controlFactor,
      ],
      end: [p1[0], p1[1]],
    },
    // Top to left
    {
      start: [p1[0], p1[1]],
      cp1: [
        p1[0] +
          (tangentPoints[1].after[0] - tangentPoints[1].before[0]) *
            controlFactor,
        p1[1] +
          (tangentPoints[1].after[1] - tangentPoints[1].before[1]) *
            controlFactor,
      ],
      cp2: [
        p2[0] -
          (tangentPoints[2].after[0] - tangentPoints[2].before[0]) *
            controlFactor,
        p2[1] -
          (tangentPoints[2].after[1] - tangentPoints[2].before[1]) *
            controlFactor,
      ],
      end: [p2[0], p2[1]],
    },
    // Left to bottom
    {
      start: [p2[0], p2[1]],
      cp1: [
        p2[0] +
          (tangentPoints[2].after[0] - tangentPoints[2].before[0]) *
            controlFactor,
        p2[1] +
          (tangentPoints[2].after[1] - tangentPoints[2].before[1]) *
            controlFactor,
      ],
      cp2: [
        p3[0] -
          (tangentPoints[3].after[0] - tangentPoints[3].before[0]) *
            controlFactor,
        p3[1] -
          (tangentPoints[3].after[1] - tangentPoints[3].before[1]) *
            controlFactor,
      ],
      end: [p3[0], p3[1]],
    },
    // Bottom to right
    {
      start: [p3[0], p3[1]],
      cp1: [
        p3[0] +
          (tangentPoints[3].after[0] - tangentPoints[3].before[0]) *
            controlFactor,
        p3[1] +
          (tangentPoints[3].after[1] - tangentPoints[3].before[1]) *
            controlFactor,
      ],
      cp2: [
        p0[0] -
          (tangentPoints[0].after[0] - tangentPoints[0].before[0]) *
            controlFactor,
        p0[1] -
          (tangentPoints[0].after[1] - tangentPoints[0].before[1]) *
            controlFactor,
      ],
      end: [p0[0], p0[1]],
    },
  ];

  // Generate SVG path using cubic Bézier curves
  const [firstCurve, ...restCurves] = curves;
  let pathData = `M ${firstCurve.start[0]} ${firstCurve.start[1]}`;

  for (const curve of curves) {
    pathData += ` C ${curve.cp1[0]} ${curve.cp1[1]}, ${curve.cp2[0]} ${curve.cp2[1]}, ${curve.end[0]} ${curve.end[1]}`;
  }

  pathData += " Z";
  return pathData;
}
