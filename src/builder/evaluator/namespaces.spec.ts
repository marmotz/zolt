import { describe, expect, test } from 'bun:test';
import { ExpressionEvaluator } from './expression-evaluator';

describe('ExpressionEvaluator - Namespaces', () => {
  const evaluator = new ExpressionEvaluator();

  describe('Math Namespace', () => {
    test('Math.floor', () => {
      expect(evaluator.evaluate('Math.floor(3.7)')).toBe(3);
    });

    test('Math.ceil', () => {
      expect(evaluator.evaluate('Math.ceil(3.2)')).toBe(4);
    });

    test('Math.round', () => {
      expect(evaluator.evaluate('Math.round(3.5)')).toBe(4);
      expect(evaluator.evaluate('Math.round(3.4)')).toBe(3);
    });

    test('Math.abs', () => {
      expect(evaluator.evaluate('Math.abs(-5)')).toBe(5);
    });

    test('Math.pow', () => {
      expect(evaluator.evaluate('Math.pow(2, 3)')).toBe(8);
    });

    test('Math.sqrt', () => {
      expect(evaluator.evaluate('Math.sqrt(16)')).toBe(4);
    });

    test('Math.min', () => {
      expect(evaluator.evaluate('Math.min(5, 2, 8, 1)')).toBe(1);
    });

    test('Math.max', () => {
      expect(evaluator.evaluate('Math.max(5, 2, 8, 1)')).toBe(8);
    });
  });

  describe('List Namespace', () => {
    test('List.length / List.count', () => {
      evaluator.setVariable('myList', [1, 2, 3]);
      expect(evaluator.evaluate('List.length($myList)')).toBe(3);
      expect(evaluator.evaluate('List.count($myList)')).toBe(3);
    });

    test('List.first', () => {
      evaluator.setVariable('myList', [1, 2, 3]);
      expect(evaluator.evaluate('List.first($myList)')).toBe(1);
    });

    test('List.last', () => {
      evaluator.setVariable('myList', [1, 2, 3]);
      expect(evaluator.evaluate('List.last($myList)')).toBe(3);
    });

    test('List.sum', () => {
      evaluator.setVariable('myList', [1, 2, 3, 4]);
      expect(evaluator.evaluate('List.sum($myList)')).toBe(10);
    });

    test('List.avg', () => {
      evaluator.setVariable('myList', [1, 2, 3, 4]);
      expect(evaluator.evaluate('List.avg($myList)')).toBe(2.5);
    });

    test('List.min', () => {
      evaluator.setVariable('myList', [5, 2, 8, 1]);
      expect(evaluator.evaluate('List.min($myList)')).toBe(1);
    });

    test('List.max', () => {
      evaluator.setVariable('myList', [5, 2, 8, 1]);
      expect(evaluator.evaluate('List.max($myList)')).toBe(8);
    });
  });

  describe('String Namespace', () => {
    test('String.upper', () => {
      expect(evaluator.evaluate('String.upper("hello")')).toBe('HELLO');
    });

    test('String.lower', () => {
      expect(evaluator.evaluate('String.lower("HELLO")')).toBe('hello');
    });

    test('String.length', () => {
      expect(evaluator.evaluate('String.length("abc")')).toBe(3);
    });

    test('String.trim', () => {
      expect(evaluator.evaluate('String.trim("  abc  ")')).toBe('abc');
    });

    test('String.replace', () => {
      expect(evaluator.evaluate('String.replace("hello world", "world", "zolt")')).toBe('hello zolt');
    });

    test('String.split', () => {
      expect(evaluator.evaluate('String.split("a,b,c", ",")')).toEqual(['a', 'b', 'c']);
    });

    test('String.join', () => {
      evaluator.setVariable('myList', ['a', 'b', 'c']);
      expect(evaluator.evaluate('String.join($myList, "-")')).toBe('a-b-c');
    });
  });

  describe('Date Namespace', () => {
    test('Date.buildTime', () => {
      expect(typeof evaluator.evaluate('Date.buildTime()')).toBe('number');
    });

    test('Date.format', () => {
      const date = new Date(2026, 1, 26, 14, 30, 45, 123); // Feb 26, 2026, 14:30:45.123
      evaluator.setVariable('myDate', date);
      expect(evaluator.evaluate('Date.format($myDate, "YYYY-MM-DD")')).toBe('2026-02-26');
      expect(evaluator.evaluate('Date.format($myDate, "HH:mm:ss.sss")')).toBe('14:30:45.123');
    });

    test('Date.parse', () => {
      const result = evaluator.evaluate('Date.parse("2026-02-26", "YYYY-MM-DD")') as Date;
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February is 1
      expect(result.getDate()).toBe(26);

      const resultMs = evaluator.evaluate('Date.parse("2026-02-26 14:30:45.123", "YYYY-MM-DD HH:mm:ss.sss")') as Date;
      expect(resultMs.getMilliseconds()).toBe(123);
    });

    test('Date.calc', () => {
      const date = new Date(2026, 1, 26);
      evaluator.setVariable('myDate', date);
      evaluator.setVariable('duration', { days: 5 });
      const result = evaluator.evaluate('Date.calc($myDate, $duration)') as Date;
      expect(result.getDate()).toBe(3); // 26 + 5 = 3 March
      expect(result.getMonth()).toBe(2); // March is 2
    });

    test('Date.diff', () => {
      const d1 = new Date(2026, 1, 26);
      const d2 = new Date(2026, 1, 21);
      evaluator.setVariable('d1', d1);
      evaluator.setVariable('d2', d2);
      expect(evaluator.evaluate('Date.diff($d1, $d2, "days")')).toBe(5);
    });
  });
});
