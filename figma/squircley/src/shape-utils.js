/**
 * Shape generation utilities for Squircley Figma Plugin
 */
// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================
/** Mathematical constants for superellipse generation */
export const SHAPE_CONSTANTS = {
    center: 144.5,
    semiMajorAxis: 100,
    semiMinorAxis: 100,
    controlFactor: 0.552,
    tangentOffset: Math.PI / 16,
};
/** Default properties for generated squircles */
export const DEFAULT_PROPERTIES = {
    width: 289,
    height: 289,
    fillColor: { r: 0.937, g: 0.706, b: 0.208 }, // #EFB435
    strokeColor: { r: 0, g: 0, b: 0 }, // #000000
    strokeWeight: 4,
};
// ============================================================================
// SHAPE GENERATION
// ============================================================================
/**
 * Calculate superellipse point using parametric equations
 */
export function calculateSuperellipsePoint(angle, semiMajorAxis, semiMinorAxis, power) {
    const cosT = Math.cos(angle);
    const sinT = Math.sin(angle);
    // Superellipse parametric equations
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
export function applyRotation(point, rotation) {
    if (rotation === 0)
        return point;
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
export function generateSuperellipsePath(semiMajorAxis, semiMinorAxis, power, rotation = 0) {
    const { center, controlFactor, tangentOffset } = SHAPE_CONSTANTS;
    // Calculate key points at 0°, 90°, 180°, 270°
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const keyPoints = [];
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
        const calcPoint = (angle) => {
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
/**
 * Generate SVG string for a squircle with given properties
 */
export function generateSquircleSvg(curvature) {
    // Map curvature slider (0-100) to power value (0.5-10)
    const power = 0.5 + (10 - 0.5) * (curvature / 100);
    // Generate SVG path
    const pathData = generateSuperellipsePath(SHAPE_CONSTANTS.semiMajorAxis, SHAPE_CONSTANTS.semiMinorAxis, power, 0 // No rotation for now
    );
    // Format colors for SVG
    const fillRgb = `rgb(${Math.round(DEFAULT_PROPERTIES.fillColor.r * 255)}, ${Math.round(DEFAULT_PROPERTIES.fillColor.g * 255)}, ${Math.round(DEFAULT_PROPERTIES.fillColor.b * 255)})`;
    const strokeRgb = `rgb(${Math.round(DEFAULT_PROPERTIES.strokeColor.r * 255)}, ${Math.round(DEFAULT_PROPERTIES.strokeColor.g * 255)}, ${Math.round(DEFAULT_PROPERTIES.strokeColor.b * 255)})`;
    return `<svg width="${DEFAULT_PROPERTIES.width}" height="${DEFAULT_PROPERTIES.height}" viewBox="0 0 ${DEFAULT_PROPERTIES.width} ${DEFAULT_PROPERTIES.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${pathData}" fill="${fillRgb}" stroke="${strokeRgb}" stroke-width="${DEFAULT_PROPERTIES.strokeWeight}"/>
  </svg>`;
}
