import chroma from 'chroma-js';

export const MissionValidator = {
  validateSteps(count: number, target: number): boolean {
    return count >= target;
  },

  validateVoice(
    transcript: string,
    phrase: string,
    threshold: number,
  ): boolean {
    if (!transcript) return false;
    const t = transcript.toLowerCase().trim();
    const p = phrase.toLowerCase().trim();

    // Exact match
    if (t === p) return true;

    // Levenshtein-based similarity
    const similarity = stringSimilarity(t, p);
    return similarity >= threshold;
  },

  validateColor(
    capturedHex: string,
    targetHex: string,
    toleranceDeltaE: number,
  ): boolean {
    try {
      const captured = chroma(capturedHex).lab();
      const target = chroma(targetHex).lab();
      // Euclidean delta-E (simplified CIEDE76)
      const deltaE = Math.sqrt(
        Math.pow(captured[0] - target[0], 2) +
        Math.pow(captured[1] - target[1], 2) +
        Math.pow(captured[2] - target[2], 2),
      );
      return deltaE <= toleranceDeltaE;
    } catch {
      return false;
    }
  },

  validateQR(
    scanned: string,
    expected: string,
    mode: 'exact' | 'prefix' | 'contains',
  ): boolean {
    if (!scanned) return false;
    switch (mode) {
      case 'exact':
        return scanned === expected;
      case 'prefix':
        return scanned.startsWith(expected);
      case 'contains':
        return scanned.includes(expected);
    }
  },
};

/**
 * Simple character-level similarity (0–1).
 * Levenshtein distance normalised by max length.
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (la === 0 || lb === 0) return 0;

  const matrix: number[][] = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const distance = matrix[la][lb];
  return 1 - distance / Math.max(la, lb);
}
