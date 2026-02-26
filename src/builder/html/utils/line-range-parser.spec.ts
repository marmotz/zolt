import { describe, expect, it } from 'bun:test';
import { parseLineRanges } from './line-range-parser';

describe('Line Range Parser', () => {
  it('should parse single lines', async () => {
    const result = parseLineRanges('1,3,10');
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.has(10)).toBe(true);
    expect(result.has(2)).toBe(false);
  });

  it('should parse ranges', async () => {
    const result = parseLineRanges('3-5');
    expect(result.has(3)).toBe(true);
    expect(result.has(4)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.has(2)).toBe(false);
    expect(result.has(6)).toBe(false);
  });

  it('should parse mixed formats', async () => {
    const result = parseLineRanges('1,3-5,10');
    expect(result.size).toBe(5);
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.has(4)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.has(10)).toBe(true);
  });

  it('should handle spaces and weird input', async () => {
    const result = parseLineRanges(' 1 , 3 - 5 ,  10 ');
    expect(result.has(1)).toBe(true);
    expect(result.has(4)).toBe(true);
    expect(result.has(10)).toBe(true);
  });

  it('should handle reversed ranges', async () => {
    const result = parseLineRanges('5-3');
    expect(result.has(3)).toBe(true);
    expect(result.has(4)).toBe(true);
    expect(result.has(5)).toBe(true);
  });
});
