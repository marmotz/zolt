import { describe, expect, it } from 'bun:test';
import { LexerState } from './lexer-state';

describe('LexerState', () => {
  it('should initialize with default values', () => {
    const state = new LexerState();
    expect(state.mode).toBe('BLOCK');
    expect(state.indentStack).toEqual([0]);
    expect(state.codeLanguage).toBeNull();
    expect(state.codeBlockDelimiter).toBeNull();
    expect(state.blockDepth).toBe(0);
  });

  it('should push and pop indents', () => {
    const state = new LexerState();
    state.pushIndent(2);
    expect(state.getCurrentIndent()).toBe(2);
    expect(state.popIndent()).toBe(2);
    expect(state.getCurrentIndent()).toBe(0);
  });

  it('should return 0 when popping empty indent stack', () => {
    const state = new LexerState();
    state.popIndent(); // pops the initial 0
    expect(state.popIndent()).toBe(0);
  });

  it('should set mode', () => {
    const state = new LexerState();
    state.setMode('INLINE');
    expect(state.mode).toBe('INLINE');
  });

  it('should enter and exit code block', () => {
    const state = new LexerState();
    state.enterCodeBlock('typescript', '```');
    expect(state.mode).toBe('CODE');
    expect(state.codeLanguage).toBe('typescript');
    expect(state.codeBlockDelimiter).toBe('```');
    expect(state.blockDepth).toBe(1);

    state.exitCodeBlock();
    expect(state.mode).toBe('BLOCK');
    expect(state.codeLanguage).toBeNull();
    expect(state.codeBlockDelimiter).toBeNull();
    expect(state.blockDepth).toBe(0);
  });

  it('should not let blockDepth go below 0', () => {
    const state = new LexerState();
    state.exitCodeBlock();
    expect(state.blockDepth).toBe(0);
  });
});
