/**
 * Configuration module for Squircley app
 */

// Coloris color picker configuration
export const COLORIS_CONFIG = {
  // Available themes: default, large, polaroid, pill (horizontal).
  theme: "large",

  // Set the theme to light or dark mode
  themeMode: "light",

  // The margin in pixels between the input fields and the color picker's dialog.
  margin: 8,

  // Set the preferred color string format (hex for SVG compatibility)
  format: "hex",

  // Enable alpha support for transparency
  alpha: true,

  // Focus the color value input when the color picker dialog is opened.
  focusInput: true,

  // Show an optional clear button
  clearButton: true,
  clearLabel: "Clear",

  // Color swatches for quick selection
  swatches: [
    "#264653",
    "#2a9d8f",
    "#efb435",
    "#f4a261",
    "#e76f51",
    "#d62828",
    "#000000",
    "#ffffff",
    "#0096c7",
    "#00b4d8",
  ],
};

// Default colors
export const DEFAULT_COLORS = {
  fill: "#EFB435",
  stroke: "#000000",
};

// Shape generation constants
export const SHAPE_CONSTANTS = {
  center: 144.5, // Center point for 289x289 viewBox
  semiMajorAxis: 100, // Semi-major axis
  semiMinorAxis: 100, // Semi-minor axis (same as a for circular base)
  controlFactor: 0.552, // Optimized factor for superellipse approximation
};

// Animation constants
export const ANIMATION_CONSTANTS = {
  transitionDuration: 300, // milliseconds
  tangentOffset: Math.PI / 16, // Small angle offset for tangent calculation
};

// SVG export constants
export const SVG_EXPORT_CONFIG = {
  width: 289,
  height: 289,
  viewBox: "-4 -4 297 297",
  filename: "squircle.svg",
};
