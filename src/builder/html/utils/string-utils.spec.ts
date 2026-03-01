import { describe, expect, it } from 'bun:test';
import { escapeHtml, formatValue, slugify, toAlpha, toRoman, transformHref } from './string-utils';

describe('string-utils', () => {
  describe('slugify', () => {
    it('should slugify basic text', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should handle special characters', () => {
      expect(slugify('Hello World! @2026')).toBe('hello-world-2026');
    });

    it('should trim and handle multiple spaces', () => {
      expect(slugify('  Hello   World  ')).toBe('hello-world');
    });

    it('should handle leading and trailing hyphens', () => {
      expect(slugify('---Hello World---')).toBe('hello-world');
    });
  });

  describe('toRoman', () => {
    it('should convert numbers to roman numerals', () => {
      expect(toRoman(1)).toBe('I');
      expect(toRoman(4)).toBe('IV');
      expect(toRoman(9)).toBe('IX');
      expect(toRoman(10)).toBe('X');
      expect(toRoman(40)).toBe('XL');
      expect(toRoman(50)).toBe('L');
      expect(toRoman(90)).toBe('XC');
      expect(toRoman(100)).toBe('C');
      expect(toRoman(400)).toBe('CD');
      expect(toRoman(500)).toBe('D');
      expect(toRoman(900)).toBe('CM');
      expect(toRoman(1000)).toBe('M');
      expect(toRoman(2026)).toBe('MMXXVI');
    });
  });

  describe('toAlpha', () => {
    it('should convert numbers to alpha (Excel-style)', () => {
      expect(toAlpha(1)).toBe('A');
      expect(toAlpha(26)).toBe('Z');
      expect(toAlpha(27)).toBe('AA');
      expect(toAlpha(52)).toBe('AZ');
      expect(toAlpha(53)).toBe('BA');
    });

    it('should return A for 0 or negative', () => {
      expect(toAlpha(0)).toBe('A');
      expect(toAlpha(-1)).toBe('A');
    });
  });

  describe('formatValue', () => {
    it('should return empty string for null or undefined', () => {
      expect(formatValue(null)).toBe('');
      expect(formatValue(undefined)).toBe('');
    });

    it('should format booleans', () => {
      expect(formatValue(true)).toBe('true');
      expect(formatValue(false)).toBe('false');
    });

    it('should format integers', () => {
      expect(formatValue(123)).toBe('123');
    });

    it('should format floats', () => {
      expect(formatValue(123.45)).toBe('123.45');
      expect(formatValue(1.0000000001)).toBe('1.0000000001');
    });

    it('should format arrays', () => {
      expect(formatValue([1, 2, 3])).toBe('[1,2,3]');
    });

    it('should format objects', () => {
      expect(formatValue({ a: 1 })).toBe('{"a":1}');
    });

    it('should format other types as string', () => {
      expect(formatValue('hello')).toBe('hello');
    });
  });

  describe('transformHref', () => {
    it('should transform .zlt to .html', () => {
      expect(transformHref('page.zlt')).toBe('page.html');
      expect(transformHref('sub/page.zlt')).toBe('sub/page.html');
    });

    it('should not transform other links', () => {
      expect(transformHref('https://google.com')).toBe('https://google.com');
      expect(transformHref('page.md')).toBe('page.md');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &#039;');
    });
  });
});
