/**
 * Shape manager module for Squircley app
 * Handles shape updates and state management
 */

import { generateSuperellipsePath } from "./superellipse.js";
import { SHAPE_CONSTANTS } from "./config.js";

/**
 * Update shape based on current control values
 */
export function updateShape() {
  const curvatureInput = document.getElementById("curvature");
  const rotationInputs = document.querySelectorAll('input[name="rotation"]');
  const previewPath = document.querySelector("#preview-svg path");

  if (!previewPath) return;

  // Map curvature slider (0-100) to p value (0.5-10)
  const curvatureValue = parseInt(curvatureInput?.value || "75");
  const p = 0.5 + (10 - 0.5) * (curvatureValue / 100);

  // Get rotation value
  let rotation = 0;
  rotationInputs.forEach((input) => {
    if (input.checked) {
      rotation = parseInt(input.value);
    }
  });

  // Generate new path (using fixed size for now, scaling handled by SVG attributes)
  const { semiMajorAxis: a, semiMinorAxis: b } = SHAPE_CONSTANTS;
  const newPath = generateSuperellipsePath(a, b, p, rotation);

  // Update the path element
  previewPath.setAttribute("d", newPath);
}

/**
 * Get current shape parameters
 * @returns {Object} Current shape configuration
 */
export function getCurrentShapeParams() {
  const curvatureInput = document.getElementById("curvature");
  const rotationInputs = document.querySelectorAll('input[name="rotation"]');

  // Map curvature slider (0-100) to p value (0.5-10)
  const curvatureValue = parseInt(curvatureInput?.value || "75");
  const p = 0.5 + (10 - 0.5) * (curvatureValue / 100);

  // Get rotation value
  let rotation = 0;
  rotationInputs.forEach((input) => {
    if (input.checked) {
      rotation = parseInt(input.value);
    }
  });

  const { semiMajorAxis: a, semiMinorAxis: b } = SHAPE_CONSTANTS;

  return { a, b, p, rotation };
}

/**
 * Update SVG scale (currently unused but available for future scale functionality)
 */
export function updateSVGScale() {
  const scaleInput = document.getElementById("scale");
  const previewSVG = document.getElementById("preview-svg");

  if (!previewSVG) return;

  // Base size for the SVG (when scale is at 50, which is the default)
  const baseSize = 289;

  // Calculate new size based on scale value (0-100 range)
  // Scale 0 = 50px, Scale 50 = 289px (base), Scale 100 = 500px
  const minSize = 50;
  const maxSize = 500;
  const scaleValue = parseInt(scaleInput?.value || "50");

  // Linear interpolation between minSize and maxSize
  const newSize = minSize + (maxSize - minSize) * (scaleValue / 100);

  // Update SVG dimensions
  previewSVG.setAttribute("width", Math.round(newSize));
  previewSVG.setAttribute("height", Math.round(newSize));
}
