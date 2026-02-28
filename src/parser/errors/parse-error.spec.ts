import { describe, expect, it } from 'bun:test';
import { ParseError } from './parse-error';

describe('ParseError', () => {
  it('should create a ParseError with correct properties', () => {
    const error = new ParseError('Test error', 1, 5, 'test.zlt', 'TEST_CODE');
    expect(error.message).toBe('Test error at line 1, column 5');
    expect(error.line).toBe(1);
    expect(error.column).toBe(5);
    expect(error.filePath).toBe('test.zlt');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('ParseError');
  });
});
