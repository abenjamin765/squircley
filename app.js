// Initialize Coloris color picker
Coloris({
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
});

// Set default colors for the inputs
document.getElementById("fillColor").value = "#EFB435";
document.getElementById("strokeColor").value = "#000000";

// Stroke functionality
function updateStroke() {
  const strokeThicknessInput = document.getElementById("strokeThickness");
  const strokeColorInput = document.getElementById("strokeColor");
  const previewPath = document.querySelector("#preview-svg path");

  // Update stroke width
  const strokeWidth = parseInt(strokeThicknessInput.value);
  previewPath.setAttribute("stroke-width", strokeWidth);

  // Update stroke color
  const strokeColor = strokeColorInput.value || "#000000";
  previewPath.setAttribute("stroke", strokeColor);
}

// Fill color functionality
function updateFillColor() {
  const fillColorInput = document.getElementById("fillColor");
  const previewPath = document.querySelector("#preview-svg path");

  const fillColor = fillColorInput.value || "#EFB435";
  previewPath.setAttribute("fill", fillColor);
}

// Scale adjustment functionality
function updateSVGScale() {
  const scaleInput = document.getElementById("scale");
  const previewSVG = document.getElementById("preview-svg");

  // Base size for the SVG (when scale is at 50, which is the default)
  const baseSize = 289;

  // Calculate new size based on scale value (0-100 range)
  // Scale 0 = 50px, Scale 50 = 289px (base), Scale 100 = 500px
  const minSize = 50;
  const maxSize = 500;
  //   const scaleValue = parseInt(scaleInput.value);

  // Linear interpolation between minSize and maxSize
  //   const newSize = minSize + (maxSize - minSize) * (scaleValue / 100);

  // Update SVG dimensions
  //   previewSVG.setAttribute("width", Math.round(newSize));
  //   previewSVG.setAttribute("height", Math.round(newSize));
}

// Add event listener for scale input
// document.getElementById("scale").addEventListener("input", updateSVGScale);

// Initialize scale on page load
updateSVGScale();

// Superellipse/Squircle path generation using 4 cubic Bézier curves
function generateSuperellipsePath(a, b, p, rotation = 0) {
  const center = 144.5; // Center point for 289x289 viewBox

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
  const tangentOffset = Math.PI / 16; // Small angle offset for tangent calculation
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
  const controlFactor = 0.552; // Optimized factor for superellipse approximation

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

// Update shape based on current control values
function updateShape() {
  const curvatureInput = document.getElementById("curvature");
  const rotationInputs = document.querySelectorAll('input[name="rotation"]');
  const previewPath = document.querySelector("#preview-svg path");

  // Map curvature slider (0-100) to p value (0.5-10)
  const curvatureValue = parseInt(curvatureInput.value);
  const p = 0.5 + (10 - 0.5) * (curvatureValue / 100);

  // Get rotation value
  let rotation = 0;
  rotationInputs.forEach((input) => {
    if (input.checked) {
      rotation = parseInt(input.value);
    }
  });

  // Generate new path (using fixed size for now, scaling handled by SVG attributes)
  const a = 100; // Semi-major axis
  const b = 100; // Semi-minor axis (same as a for circular base)

  const newPath = generateSuperellipsePath(a, b, p, rotation);

  // Update the path element
  previewPath.setAttribute("d", newPath);
}

// Add event listeners for curvature and rotation
document.getElementById("curvature").addEventListener("input", updateShape);
document.querySelectorAll('input[name="rotation"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    const newRotation = parseInt(e.target.value);
    startRotationTransition(newRotation);
  });
});

// Add event listeners for stroke and fill
document
  .getElementById("strokeThickness")
  .addEventListener("input", updateStroke);
document.getElementById("strokeColor").addEventListener("input", updateStroke);
document.getElementById("fillColor").addEventListener("input", updateFillColor);

// Add event listeners for export buttons
document
  .getElementById("downloadButton")
  .addEventListener("click", downloadSVG);
document
  .getElementById("copyButton")
  .addEventListener("click", copySVGToClipboard);

// Initialize shape and colors on page load
updateShape();
updateStroke();
updateFillColor();

// Export functionality
function generateCleanSVG() {
  const previewSVG = document.getElementById("preview-svg");
  const previewPath = document.querySelector("#preview-svg path");

  // Get current attributes
  const pathD = previewPath.getAttribute("d");
  const fill = previewPath.getAttribute("fill");
  const stroke = previewPath.getAttribute("stroke");
  const strokeWidth = previewPath.getAttribute("stroke-width");

  // Create clean SVG markup
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="289" height="289" viewBox="-4 -4 297 297" fill="none">
  <path d="${pathD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
</svg>`;

  return svgContent;
}

// Download SVG file
function downloadSVG() {
  const svgContent = generateCleanSVG();
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement("a");
  link.href = url;
  link.download = "squircle.svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

// Copy SVG to clipboard
async function copySVGToClipboard() {
  const svgContent = generateCleanSVG();

  try {
    await navigator.clipboard.writeText(svgContent);

    // Show feedback (temporarily change button text)
    const copyButton = document.getElementById("copyButton");
    const originalText = copyButton.textContent;
    copyButton.textContent = "Copied!";

    setTimeout(() => {
      copyButton.textContent = originalText;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy SVG to clipboard:", err);

    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = svgContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    // Show feedback
    const copyButton = document.getElementById("copyButton");
    const originalText = copyButton.textContent;
    copyButton.textContent = "Copied!";

    setTimeout(() => {
      copyButton.textContent = originalText;
    }, 2000);
  }
}

// Rotation transition variables
let isTransitioning = false;
let transitionId = null;
let currentRotation = 0;
let targetRotation = 0;
const transitionDuration = 300; // milliseconds
let transitionStartTime = null;

// Smooth transition function
function animateRotationTransition(timestamp) {
  if (!transitionStartTime) {
    transitionStartTime = timestamp;
  }

  const elapsed = timestamp - transitionStartTime;
  const progress = Math.min(elapsed / transitionDuration, 1);

  // Use easeInOutCubic for smooth animation
  const easeProgress =
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  // Calculate current rotation with easing
  const rotationDiff = targetRotation - currentRotation;
  const animatedRotation = currentRotation + rotationDiff * easeProgress;

  // Update shape with animated rotation
  const curvatureInput = document.getElementById("curvature");
  const previewPath = document.querySelector("#preview-svg path");

  const curvatureValue = parseInt(curvatureInput.value);
  const p = 0.5 + (10 - 0.5) * (curvatureValue / 100);

  const a = 100;
  const b = 100;

  const newPath = generateSuperellipsePath(a, b, p, animatedRotation);
  previewPath.setAttribute("d", newPath);

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

// Start rotation transition
function startRotationTransition(newRotation) {
  if (isTransitioning && transitionId) {
    cancelAnimationFrame(transitionId);
  }

  targetRotation = newRotation;
  isTransitioning = true;
  transitionStartTime = null;

  requestAnimationFrame(animateRotationTransition);
}
