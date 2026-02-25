import { describe, expect, it } from 'bun:test';
import { ExpressionEvaluator } from './expression-evaluator';

describe('ExpressionEvaluator - Date Functions', () => {
  const evaluator = new ExpressionEvaluator();

  describe('Date.parse', () => {
    it('should parse ISO date strings', () => {
      const result = evaluator.evaluate('Date.parse("2026-02-25")');
      expect(result).toBeInstanceOf(Date);
      if (result instanceof Date) {
        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(1); // February
        expect(result.getDate()).toBe(25);
      }
    });

    it('should parse with format (basic support)', () => {
      // For now, we'll support simple DD/MM/YYYY
      const result = evaluator.evaluate('Date.parse("25/02/2026", "DD/MM/YYYY")');
      expect(result).toBeInstanceOf(Date);
      if (result instanceof Date) {
        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(1);
        expect(result.getDate()).toBe(25);
      }
    });
  });

  describe('Date.calc', () => {
    it('should add days using object', () => {
      // 2026-02-25 + 2 days = 2026-02-27
      const result = evaluator.evaluate('Date.calc("2026-02-25", { days: 2 })');
      expect(result).toBeInstanceOf(Date);
      if (result instanceof Date) {
        expect(result.getDate()).toBe(27);
      }
    });

    it('should subtract days using negative values', () => {
      // 2026-02-25 - 2 days = 2026-02-23
      const result = evaluator.evaluate('Date.calc("2026-02-25", { days: -2 })');
      expect(result).toBeInstanceOf(Date);
      if (result instanceof Date) {
        expect(result.getDate()).toBe(23);
      }
    });

    it('should add multiple units (complex duration)', () => {
      // 2026-02-25 + 1 day + 2 hours
      const result = evaluator.evaluate('Date.calc("2026-02-25T10:00:00", { days: 1, hours: 2 })');
      expect(result).toBeInstanceOf(Date);
      if (result instanceof Date) {
        expect(result.getDate()).toBe(26);
        expect(result.getHours()).toBe(12);
      }
    });

    it('should add months', () => {
      // 2026-02-25 + 1 month = 2026-03-25
      const result = evaluator.evaluate('Date.calc("2026-02-25", { months: 1 })');
      expect(result).toBeInstanceOf(Date);
      if (result instanceof Date) {
        expect(result.getMonth()).toBe(2); // March
      }
    });

    it('should add years', () => {
      const result = evaluator.evaluate('Date.calc("2026-02-25", { years: 1 })');
      expect(result).toBeInstanceOf(Date);
      if (result instanceof Date) {
        expect(result.getFullYear()).toBe(2027);
      }
    });
  });

  describe('Date.diff', () => {
    it('should return difference in days', () => {
      const result = evaluator.evaluate('Date.diff("2026-02-27", "2026-02-25", "days")');
      expect(result).toBe(2);
    });

    it('should return negative difference if second date is later', () => {
      const result = evaluator.evaluate('Date.diff("2026-02-25", "2026-02-27", "days")');
      expect(result).toBe(-2);
    });

    it('should return difference in hours', () => {
      const result = evaluator.evaluate('Date.diff("2026-02-25T14:00:00", "2026-02-25T12:00:00", "hours")');
      expect(result).toBe(2);
    });
  });

  describe('Chaining Date Functions', () => {
    it('should work with Date.format(Date.parse(...))', () => {
      const result = evaluator.evaluate('Date.format(Date.parse("25/02/2026", "DD/MM/YYYY"), "YYYY-MM-DD")');
      expect(result).toBe('2026-02-25');
    });

    it('should work with Date.format(Date.calc(...))', () => {
      const result = evaluator.evaluate('Date.format(Date.calc("2026-02-25", { day: 1 }), "DD/MM/YYYY")');
      expect(result).toBe('26/02/2026');
    });
  });
});
