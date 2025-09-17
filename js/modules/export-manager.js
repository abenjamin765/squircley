/**
 * Export manager module for Squircley app
 * Handles SVG download and clipboard functionality
 */

import { SVG_EXPORT_CONFIG } from "./config.js";

/**
 * Generate clean SVG markup from current preview
 * @returns {string} SVG content as string
 */
export function generateCleanSVG() {
  const previewSVG = document.getElementById("preview-svg");
  const previewPath = document.querySelector("#preview-svg path");

  if (!previewSVG || !previewPath) return "";

  // Get current attributes
  const pathD = previewPath.getAttribute("d");
  const fill = previewPath.getAttribute("fill");
  const stroke = previewPath.getAttribute("stroke");
  const strokeWidth = previewPath.getAttribute("stroke-width");

  // Create clean SVG markup
  const { width, height, viewBox } = SVG_EXPORT_CONFIG;
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" fill="none">
  <path d="${pathD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
</svg>`;

  return svgContent;
}

/**
 * Download SVG file
 */
export function downloadSVG() {
  const svgContent = generateCleanSVG();

  if (!svgContent) {
    console.error("Failed to generate SVG content");
    return;
  }

  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement("a");
  link.href = url;
  link.download = SVG_EXPORT_CONFIG.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Copy SVG to clipboard
 */
export async function copySVGToClipboard() {
  const svgContent = generateCleanSVG();

  if (!svgContent) {
    console.error("Failed to generate SVG content");
    return;
  }

  try {
    await navigator.clipboard.writeText(svgContent);
    showCopyFeedback();
  } catch (err) {
    console.error("Failed to copy SVG to clipboard:", err);
    // Fallback for older browsers
    fallbackCopyToClipboard(svgContent);
  }
}

/**
 * Show feedback when SVG is copied to clipboard
 */
function showCopyFeedback() {
  const copyButton = document.getElementById("copyButton");
  if (!copyButton) return;

  const originalText = copyButton.textContent;
  copyButton.textContent = "Copied!";

  setTimeout(() => {
    copyButton.textContent = originalText;
  }, 2000);
}

/**
 * Fallback copy method for older browsers
 * @param {string} text - Text to copy
 */
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);

  // Show feedback
  showCopyFeedback();
}
