/**
 * Deterministic PRNG using Mulberry32 algorithm.
 * Generates uniform float in [0, 1) with consistent seed replay across platforms.
 */
export class Mulberry32 {
  private s: number;

  constructor(seed: number) {
    this.s = Math.floor(seed) >>> 0;
  }

  /**
   * Return pseudorandom 32-bit unsigned integer
   */
  nextUint32(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /**
   * Return float in range [0, 1)
   */
  next(): number {
    return this.nextUint32() / 4294967296;
  }
}
