import chroma from 'chroma-js';

export const MissionValidator = {
  validateSteps(count: number, target: number): boolean {
    return count >= target;
  },

  voiceScore(transcript: string, phrase: string): number {
    if (!transcript) return 0;
    const t = transcript.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const p = phrase.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (t === p) return 1;
    // Word-level Jaccard — robust to punctuation differences and minor word-order shifts from STT
    return wordJaccard(t, p);
  },

  validateVoice(
    transcript: string,
    phrase: string,
    threshold: number,
  ): boolean {
    return this.voiceScore(transcript, phrase) >= threshold;
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

function wordJaccard(a: string, b: string): number {
  const wa = new Set(a.split(/\s+/).filter(Boolean));
  const wb = new Set(b.split(/\s+/).filter(Boolean));
  let intersection = 0;
  wa.forEach((w) => { if (wb.has(w)) intersection++; });
  const union = new Set([...wa, ...wb]).size;
  return union === 0 ? 0 : intersection / union;
}

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
