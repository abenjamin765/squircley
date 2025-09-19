/**
 * UI Controller for Squircley Figma Plugin
 */
// ============================================================================
// CONFIGURATION & STATE
// ============================================================================
/** Current curvature value (0-100) */
let currentCurvature = 75;
/** Shape generation constants (matching backend) */
export const SHAPE_CONSTANTS = {
    center: 144.5,
    semiMajorAxis: 100,
    semiMinorAxis: 100,
    controlFactor: 0.552,
    tangentOffset: Math.PI / 16,
};
// ============================================================================
// SHAPE GENERATION (Shared with backend)
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
    return {
        x: semiMajorAxis * cosPower,
        y: semiMinorAxis * sinPower,
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
    // For now, let's create a simple rectangle to test if the issue is with the superellipse formula
    // We'll use the key points directly without complex Bézier curves
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const keyPoints = angles.map((angle) => {
        let point = calculateSuperellipsePoint(angle, semiMajorAxis, semiMinorAxis, power);
        point = applyRotation(point, rotation);
        return {
            x: point.x + center,
            y: point.y + center,
        };
    });
    // Calculate tangent points for smooth curve approximation
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
    // Generate Bézier curves for smooth path
    const curves = [];
    for (let i = 0; i < 4; i++) {
        const start = [keyPoints[i].x, keyPoints[i].y];
        const end = [keyPoints[(i + 1) % 4].x, keyPoints[(i + 1) % 4].y];
        const tangent = tangentPoints[i];
        const nextTangent = tangentPoints[(i + 1) % 4];
        curves.push({
            start,
            cp1: [
                start[0] + (tangent.after[0] - tangent.before[0]) * controlFactor,
                start[1] + (tangent.after[1] - tangent.before[1]) * controlFactor,
            ],
            cp2: [
                end[0] -
                    (nextTangent.after[0] - nextTangent.before[0]) * controlFactor,
                end[1] -
                    (nextTangent.after[1] - nextTangent.before[1]) * controlFactor,
            ],
            end,
        });
    }
    // Generate SVG path using cubic Bézier curves
    const [firstCurve, ...restCurves] = curves;
    let pathData = `M ${firstCurve.start[0]} ${firstCurve.start[1]}`;
    for (const curve of curves) {
        pathData += ` C ${curve.cp1[0]} ${curve.cp1[1]}, ${curve.cp2[0]} ${curve.cp2[1]}, ${curve.end[0]} ${curve.end[1]}`;
    }
    pathData += " Z";
    return pathData;
}
// ============================================================================
// UI CONTROLLER
// ============================================================================
/**
 * Initialize UI controller with DOM elements
 */
export function initializeUIController(elements) {
    // Set up initial state
    updateSliderValue(elements);
    // Initialize preview
    updatePreview(elements);
}
/**
 * Update the preview SVG with current curvature
 */
export function updatePreview(elements) {
    const power = 0.5 + (10 - 0.5) * (currentCurvature / 100);
    const pathData = generateSuperellipsePath(SHAPE_CONSTANTS.semiMajorAxis, SHAPE_CONSTANTS.semiMinorAxis, power, 0);
    if (elements.previewPath) {
        elements.previewPath.setAttribute("d", pathData);
    }
}
/**
 * Update slider value display and preview
 */
export function updateSliderValue(elements) {
    if (elements.curvatureSlider) {
        currentCurvature = parseInt(elements.curvatureSlider.value);
    }
    if (elements.curvatureValue) {
        elements.curvatureValue.textContent = currentCurvature.toString();
    }
    updatePreview(elements);
}
/**
 * Get current curvature value
 */
export function getCurrentCurvature() {
    return currentCurvature;
}
/**
 * Set current curvature value
 */
export function setCurrentCurvature(value) {
    currentCurvature = Math.max(0, Math.min(100, value));
}
/**
 * Handle create button click
 */
export function handleCreateClick(elements) {
    // Add exit animation
    if (elements.previewSvg) {
        elements.previewSvg.classList.add("exit-animation");
    }
    // Send message to create squircle
    if (typeof parent !== 'undefined' && parent.postMessage) {
        parent.postMessage({
            pluginMessage: {
                type: "create-squircle",
                curvature: currentCurvature,
            },
        }, "*");
    }
    // Reset the animation and update preview after a brief delay
    setTimeout(() => {
        if (elements.previewSvg) {
            elements.previewSvg.classList.remove("exit-animation");
        }
        updatePreview(elements);
    }, 500);
}
/**
 * Handle slider input changes
 */
export function handleSliderInput(elements) {
    updateSliderValue(elements);
}
