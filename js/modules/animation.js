/**
 * Animation module for Squircley app
 * Handles smooth rotation transitions
 */

import { generateSuperellipsePath } from "./superellipse.js";
import { SHAPE_CONSTANTS, ANIMATION_CONSTANTS } from "./config.js";

// Animation state variables
let isTransitioning = false;
let transitionId = null;
let currentRotation = 0;
let targetRotation = 0;
let transitionStartTime = null;

/**
 * Smooth transition animation function
 * @param {number} timestamp - Animation timestamp
 */
function animateRotationTransition(timestamp) {
  if (!transitionStartTime) {
    transitionStartTime = timestamp;
  }

  const elapsed = timestamp - transitionStartTime;
  const progress = Math.min(
    elapsed / ANIMATION_CONSTANTS.transitionDuration,
    1
  );

  // Use easeInOutCubic for smooth animation
  const easeProgress =
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  // Calculate current rotation with easing
  const rotationDiff = targetRotation - currentRotation;
  const animatedRotation = currentRotation + rotationDiff * easeProgress;

  // Update shape with animated rotation
  updateShapeWithRotation(animatedRotation);

  if (progress < 1) {
    transitionId = requestAnimationFrame(animateRotationTransition);
  } else {
    // Animation complete
    currentRotation = targetRotation;
    isTransitioning = false;
    transitionId = null;
    transitionStartTime = null;
  }
}

/**
 * Update shape with specific rotation angle
 * @param {number} rotation - Rotation angle in degrees
 */
function updateShapeWithRotation(rotation) {
  const curvatureInput = document.getElementById("curvature");
  const previewPath = document.querySelector("#preview-svg path");

  if (!previewPath) return;

  const curvatureValue = parseInt(curvatureInput?.value || "75");
  const p = 0.5 + (10 - 0.5) * (curvatureValue / 100);

  const { semiMajorAxis: a, semiMinorAxis: b } = SHAPE_CONSTANTS;
  const newPath = generateSuperellipsePath(a, b, p, rotation);
  previewPath.setAttribute("d", newPath);
}

/**
 * Start rotation transition
 * @param {number} newRotation - Target rotation angle in degrees
 */
export function startRotationTransition(newRotation) {
  if (isTransitioning && transitionId) {
    cancelAnimationFrame(transitionId);
  }

  targetRotation = newRotation;
  isTransitioning = true;
  transitionStartTime = null;

  requestAnimationFrame(animateRotationTransition);
}

/**
 * Get current animation state
 * @returns {Object} Animation state
 */
export function getAnimationState() {
  return {
    isTransitioning,
    currentRotation,
    targetRotation,
  };
}

/**
 * Cancel any ongoing animation
 */
export function cancelAnimation() {
  if (transitionId) {
    cancelAnimationFrame(transitionId);
    isTransitioning = false;
    transitionId = null;
    transitionStartTime = null;
  }
}
