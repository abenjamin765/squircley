/**
 * Main application entry point for Squircley
 * Imports and initializes all modules
 */

import {
  initColorPicker,
  setDefaultColors,
  updateStroke,
  updateFillColor,
} from "./modules/color-picker.js";
import { updateShape } from "./modules/shape-manager.js";
import { downloadSVG, copySVGToClipboard } from "./modules/export-manager.js";
import { startRotationTransition } from "./modules/animation.js";

/**
 * Initialize the application
 */
function initApp() {
  // Set default colors BEFORE initializing Coloris
  setDefaultColors();

  // Initialize color picker
  initColorPicker();

  // After Coloris initializes, update the clr-field colors
  setTimeout(() => {
    updateClrFieldColors();
  }, 100);

  // Set up event listeners
  setupEventListeners();

  // Initialize shape and colors on page load
  updateShape();
  updateStroke();
  updateFillColor();
}

/**
 * Update the color of Coloris field wrappers for button visibility
 */
function updateClrFieldColors() {
  const fillColorInput = document.getElementById("fillColor");
  const strokeColorInput = document.getElementById("strokeColor");

  if (fillColorInput) {
    const fillClrField = fillColorInput.closest(".clr-field");
    if (fillClrField) {
      fillClrField.style.color = DEFAULT_COLORS.fill;
    }
  }

  if (strokeColorInput) {
    const strokeClrField = strokeColorInput.closest(".clr-field");
    if (strokeClrField) {
      strokeClrField.style.color = DEFAULT_COLORS.stroke;
    }
  }
}

/**
 * Set up all DOM event listeners
 */
function setupEventListeners() {
  // Shape controls
  const curvatureInput = document.getElementById("curvature");
  if (curvatureInput) {
    curvatureInput.addEventListener("input", updateShape);
  }

  // Rotation controls
  const rotationInputs = document.querySelectorAll('input[name="rotation"]');
  rotationInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      const newRotation = parseInt(e.target.value);
      startRotationTransition(newRotation);
    });
  });

  // Color controls
  const strokeThicknessInput = document.getElementById("strokeThickness");
  const strokeColorInput = document.getElementById("strokeColor");
  const fillColorInput = document.getElementById("fillColor");

  if (strokeThicknessInput) {
    strokeThicknessInput.addEventListener("input", updateStroke);
  }
  if (strokeColorInput) {
    strokeColorInput.addEventListener("input", updateStroke);
  }
  if (fillColorInput) {
    fillColorInput.addEventListener("input", updateFillColor);
  }

  // Export buttons
  const downloadButton = document.getElementById("downloadButton");
  const copyButton = document.getElementById("copyButton");

  if (downloadButton) {
    downloadButton.addEventListener("click", downloadSVG);
  }
  if (copyButton) {
    copyButton.addEventListener("click", copySVGToClipboard);
  }
}

// Initialize the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // Small delay to ensure all scripts are loaded
    setTimeout(initApp, 10);
  });
} else {
  // Small delay to ensure all scripts are loaded
  setTimeout(initApp, 10);
}
