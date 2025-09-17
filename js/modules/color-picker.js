/**
 * Color picker module for Squircley app
 * Handles color picker initialization and color updates
 */

import { COLORIS_CONFIG, DEFAULT_COLORS } from "./config.js";

/**
 * Initialize the Coloris color picker with configuration
 * This should be called after DOM is ready
 */
export function initColorPicker() {
  if (typeof Coloris !== "undefined") {
    try {
      Coloris(COLORIS_CONFIG);
    } catch (error) {
      console.warn("Coloris initialization failed:", error);
    }
  } else {
    console.warn("Coloris not loaded yet");
  }
}

/**
 * Set default colors for the color inputs
 * This should be called BEFORE Coloris initialization
 */
export function setDefaultColors() {
  const fillColorInput = document.getElementById("fillColor");
  const strokeColorInput = document.getElementById("strokeColor");

  if (fillColorInput) {
    fillColorInput.value = DEFAULT_COLORS.fill;
  }

  if (strokeColorInput) {
    strokeColorInput.value = DEFAULT_COLORS.stroke;
  }
}

/**
 * Update stroke properties (width and color) on the preview SVG
 */
export function updateStroke() {
  const strokeThicknessInput = document.getElementById("strokeThickness");
  const strokeColorInput = document.getElementById("strokeColor");
  const previewPath = document.querySelector("#preview-svg path");

  if (!previewPath) return;

  // Update stroke width
  const strokeWidth = parseInt(strokeThicknessInput?.value || "4");
  previewPath.setAttribute("stroke-width", strokeWidth);

  // Update stroke color
  const strokeColor = strokeColorInput?.value || DEFAULT_COLORS.stroke;
  previewPath.setAttribute("stroke", strokeColor);

  // Update Coloris field color for button visibility
  if (strokeColorInput) {
    const clrField = strokeColorInput.closest(".clr-field");
    if (clrField) {
      clrField.style.color = strokeColor;
    }
  }
}

/**
 * Update fill color on the preview SVG
 */
export function updateFillColor() {
  const fillColorInput = document.getElementById("fillColor");
  const previewPath = document.querySelector("#preview-svg path");

  if (!previewPath) return;

  const fillColor = fillColorInput?.value || DEFAULT_COLORS.fill;
  previewPath.setAttribute("fill", fillColor);

  // Update Coloris field color for button visibility
  if (fillColorInput) {
    const clrField = fillColorInput.closest(".clr-field");
    if (clrField) {
      clrField.style.color = fillColor;
    }
  }
}
