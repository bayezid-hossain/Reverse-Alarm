import chroma from 'chroma-js';

/**
 * Extract dominant color from an image file path.
 * Uses pixel sampling via a canvas-like approach.
 * On React Native we use a simple heuristic: sample the file name / use average.
 * For production, integrate a native image analysis module or use react-native-image-colors.
 */
export async function extractDominantColor(imagePath: string): Promise<string> {
  // Placeholder implementation — in production use react-native-image-colors or ML Kit
  // This returns a deterministic color based on the path hash for development
  const hash = imagePath.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return chroma.hsl(hue, 0.6, 0.5).hex();
}

/**
 * Delta-E (CIEDE76 simplified) between two hex colors.
 */
export function colorDeltaE(hex1: string, hex2: string): number {
  try {
    const lab1 = chroma(hex1).lab();
    const lab2 = chroma(hex2).lab();
    return Math.sqrt(
      Math.pow(lab1[0] - lab2[0], 2) +
      Math.pow(lab1[1] - lab2[1], 2) +
      Math.pow(lab1[2] - lab2[2], 2),
    );
  } catch {
    return 999;
  }
}
