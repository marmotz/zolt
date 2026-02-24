import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { Parser } from '../parser';

describe('ListParser', () => {
  test('should parse bullet list', () => {
    const input = `- item 1
- item 2`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('bullet');
    expect((ast.children[0] as any).children.length).toBe(2);
  });

  test('should parse numbered list', () => {
    const input = `1. First
2. Second`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('numbered');
  });

  test('should parse task list', () => {
    const input = `- [ ] Task 1
- [x] Task 2`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('task');
    expect((ast.children[0] as any).children[0].checked).toBe(false);
    expect((ast.children[0] as any).children[1].checked).toBe(true);
  });

  test('should parse definition list', () => {
    const input = `: Term
:   Definition`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('definition');
  });
});
