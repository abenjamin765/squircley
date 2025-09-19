/**
 * Squircley Figma Plugin
 * Generates customizable squircle shapes in Figma
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/** Default properties for generated squircles */
const DEFAULT_PROPERTIES = {
  width: 289,
  height: 289,
  fillColor: { r: 0.937, g: 0.706, b: 0.208 }, // #EFB435
  strokeColor: { r: 0, g: 0, b: 0 }, // #000000
  strokeWeight: 4,
} as const;

/** Mathematical constants for superellipse generation */
const SHAPE_CONSTANTS = {
  center: 144.5,
  semiMajorAxis: 100,
  semiMinorAxis: 100,
  controlFactor: 0.552,
  tangentOffset: Math.PI / 16,
} as const;

/** UI configuration */
const UI_CONFIG = {
  width: 300,
  height: 300,
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

interface SquircleProperties {
  width: number;
  height: number;
  fillColor: RGBColor;
  strokeColor: RGBColor;
  strokeWeight: number;
}

interface ShapeConstants {
  center: number;
  semiMajorAxis: number;
  semiMinorAxis: number;
  controlFactor: number;
  tangentOffset: number;
}

interface Point {
  x: number;
  y: number;
}

interface BezierCurve {
  start: Point;
  cp1: Point;
  cp2: Point;
  end: Point;
}

type MessageType = "create-squircle" | "cancel";

// ============================================================================
// INITIALIZATION
// ============================================================================

/** Initialize the plugin UI */
figma.showUI(__html__, UI_CONFIG);

// ============================================================================
// SHAPE GENERATION
// ============================================================================

/**
 * Calculate superellipse point using parametric equations
 */
function calculateSuperellipsePoint(
  angle: number,
  semiMajorAxis: number,
  semiMinorAxis: number,
  power: number
): Point {
  const cosT = Math.cos(angle);
  const sinT = Math.sin(angle);

  // Superellipse parametric equations (same as web app)
  const cosPower = Math.pow(Math.abs(cosT), 2 / power) * Math.sign(cosT);
  const sinPower = Math.pow(Math.abs(sinT), 2 / power) * Math.sign(sinT);

  const x = semiMajorAxis * cosPower;
  const y = semiMinorAxis * sinPower;

  return {
    x: x,
    y: y,
  };
}

/**
 * Apply rotation transformation to a point
 */
function applyRotation(point: Point, rotation: number): Point {
  if (rotation === 0) return point;

  const rad = (rotation * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);

  return {
    x: point.x * cosR - point.y * sinR,
    y: point.x * sinR + point.y * cosR,
  };
}

/**
 * Generate superellipse path using cubic Bézier curves
 */
function generateSuperellipsePath(
  semiMajorAxis: number,
  semiMinorAxis: number,
  power: number,
  rotation: number = 0
): string {
  const { center, controlFactor, tangentOffset } = SHAPE_CONSTANTS;

  // Calculate key points at 0°, 90°, 180°, 270°
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const keyPoints: [number, number][] = [];

  for (const angle of angles) {
    const cosT = Math.cos(angle);
    const sinT = Math.sin(angle);

    // Superellipse parametric equations
    const cosPower = Math.pow(Math.abs(cosT), 2 / power) * Math.sign(cosT);
    const sinPower = Math.pow(Math.abs(sinT), 2 / power) * Math.sign(sinT);

    let x = semiMajorAxis * cosPower;
    let y = semiMinorAxis * sinPower;

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

  // Calculate tangent points for better curve approximation
  const tangentPoints = [];
  for (let i = 0; i < 4; i++) {
    const baseAngle = (i * Math.PI) / 2;
    const angle1 = baseAngle - tangentOffset;
    const angle2 = baseAngle + tangentOffset;

    const calcPoint = (angle: number) => {
      const cosT = Math.cos(angle);
      const sinT = Math.sin(angle);
      const cosPower = Math.pow(Math.abs(cosT), 2 / power) * Math.sign(cosT);
      const sinPower = Math.pow(Math.abs(sinT), 2 / power) * Math.sign(sinT);

      let x = semiMajorAxis * cosPower;
      let y = semiMinorAxis * sinPower;

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

  const [p0, p1, p2, p3] = keyPoints;

  // Generate Bézier curves
  const curves = [
    {
      start: p0,
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
      end: p1,
    },
    {
      start: p1,
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
      end: p2,
    },
    {
      start: p2,
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
      end: p3,
    },
    {
      start: p3,
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
      end: p0,
    },
  ];

  // Generate SVG path
  let pathData = `M ${p0[0]} ${p0[1]}`;
  for (const curve of curves) {
    pathData += ` C ${curve.cp1[0]} ${curve.cp1[1]}, ${curve.cp2[0]} ${curve.cp2[1]}, ${curve.end[0]} ${curve.end[1]}`;
  }
  pathData += " Z";

  return pathData;
}

// ============================================================================
// SQUIRCLE CREATION
// ============================================================================

/**
 * Generate SVG string for a squircle with given properties
 */
function generateSquircleSvg(curvature: number): string {
  // Map curvature slider (0-100) to power value (0.5-10)
  const power = 0.5 + (10 - 0.5) * (curvature / 100);

  // Generate SVG path
  const pathData = generateSuperellipsePath(
    SHAPE_CONSTANTS.semiMajorAxis,
    SHAPE_CONSTANTS.semiMinorAxis,
    power,
    0 // No rotation for now
  );

  // Format colors for SVG
  const fillRgb = `rgb(${Math.round(
    DEFAULT_PROPERTIES.fillColor.r * 255
  )}, ${Math.round(DEFAULT_PROPERTIES.fillColor.g * 255)}, ${Math.round(
    DEFAULT_PROPERTIES.fillColor.b * 255
  )})`;
  const strokeRgb = `rgb(${Math.round(
    DEFAULT_PROPERTIES.strokeColor.r * 255
  )}, ${Math.round(DEFAULT_PROPERTIES.strokeColor.g * 255)}, ${Math.round(
    DEFAULT_PROPERTIES.strokeColor.b * 255
  )})`;

  return `<svg width="${DEFAULT_PROPERTIES.width}" height="${DEFAULT_PROPERTIES.height}" viewBox="0 0 ${DEFAULT_PROPERTIES.width} ${DEFAULT_PROPERTIES.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${pathData}" fill="${fillRgb}" stroke="${strokeRgb}" stroke-width="${DEFAULT_PROPERTIES.strokeWeight}"/>
  </svg>`;
}

/**
 * Get the currently selected frame, if any
 */
function getSelectedFrame(): FrameNode | null {
  const selection = figma.currentPage.selection;
  return (selection.find((node) => node.type === "FRAME") as FrameNode) || null;
}

/**
 * Position a node at the viewport center
 */
function centerNodeInViewport(node: SceneNode): void {
  const viewport = figma.viewport.center;
  node.x = viewport.x - node.width / 2;
  node.y = viewport.y - node.height / 2;
}

/**
 * Create a squircle SVG, either directly on canvas or inside selected frame
 */
function createSquircle(curvature: number): SceneNode {
  const svgString = generateSquircleSvg(curvature);
  const selectedFrame = getSelectedFrame();

  let svgNode: any;
  let targetNode: SceneNode;

  if (selectedFrame) {
    // Import SVG into selected frame
    svgNode = figma.createNodeFromSvg(svgString);
    selectedFrame.appendChild(svgNode);
    targetNode = selectedFrame;
  } else {
    // Import SVG directly to canvas
    svgNode = figma.createNodeFromSvg(svgString);

    // Name auto-generated frames
    if (svgNode.type === "FRAME") {
      svgNode.name = "Squircle";
    }

    figma.currentPage.appendChild(svgNode);
    targetNode = svgNode;

    // Center the SVG in viewport
    centerNodeInViewport(svgNode);
  }

  // Select and focus on the created node
  figma.currentPage.selection = [targetNode];
  figma.viewport.scrollAndZoomIntoView([targetNode]);

  return targetNode;
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Handle messages from the plugin UI
 */
function handleUIMessage(msg: { type: MessageType; curvature?: number }): void {
  try {
    switch (msg.type) {
      case "create-squircle":
        if (typeof msg.curvature !== "number") {
          throw new Error("Curvature value is required for create-squircle");
        }

        createSquircle(msg.curvature);
        figma.notify("Squircle created successfully!");
        break;

      case "cancel":
        figma.closePlugin();
        break;

      default:
        console.warn("Unknown message type:", msg.type);
        break;
    }
  } catch (error) {
    console.error("Plugin error:", error);
    figma.notify("An error occurred. Please try again.");
  }
}

/**
 * Handle plugin close event
 */
function handlePluginClose(): void {
  figma.closePlugin();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/** Set up message handling from UI */
figma.ui.onmessage = handleUIMessage;

/** Handle plugin close */
figma.on("close", handlePluginClose);
